import mongoose from "mongoose";
import { AppError } from "../../shared/utils/AppError.js";
import { PAYMENT_KINDS, PAYMENT_METHODS } from "../payments/payment.constants.js";
import { Payment } from "../payments/payment.model.js";
import {
  assertSameRequest,
  chargeSandbox,
  findPaymentByKey,
  hashRequest,
} from "../payments/payment.service.js";
import { lockUser } from "../users/user.service.js";
import { packagePlans } from "./package.config.js";
import { Package } from "./package.model.js";

function serializePackage(pkg) {
  return {
    id: pkg._id,
    planCode: pkg.planCode,
    planName: pkg.planName,
    sessionsTotal: pkg.sessionsTotal,
    sessionsUsed: pkg.sessionsUsed,
    sessionsRemaining: pkg.sessionsTotal - pkg.sessionsUsed,
    pricePaid: pkg.pricePaid,
    purchasedAt: pkg.createdAt,
  };
}

export const listPlans = () =>
  packagePlans.map(({ code, name, sessions, price }) => ({ code, name, sessions, price }));

export async function getMyPackages(customerId) {
  const packages = await Package.find({ customer: customerId }).sort("createdAt").lean();

  const sessionsPurchased = packages.reduce((sum, pkg) => sum + pkg.sessionsTotal, 0);
  const sessionsUsed = packages.reduce((sum, pkg) => sum + pkg.sessionsUsed, 0);

  return {
    summary: {
      sessionsPurchased,
      sessionsUsed,
      sessionsRemaining: sessionsPurchased - sessionsUsed,
    },
    packages: packages.map(serializePackage),
  };
}

export async function purchasePackage(customerId, { planCode }, idempotencyKey) {
  const plan = packagePlans.find((item) => item.code === planCode);
  if (!plan) throw new AppError("Unknown package plan", 400);

  const requestHash = hashRequest({ type: "package_purchase", planCode });
  let result = null;

  await mongoose.connection.transaction(async (session) => {
    result = null; // the callback can run again after a write conflict

    await lockUser(customerId, session);

    const existing = await findPaymentByKey(customerId, idempotencyKey, session);
    if (existing) {
      assertSameRequest(existing, requestHash);
      const pkg = await Package.findById(existing.package).session(session).lean();
      result = { pkg, replayed: true };
      return;
    }

    const charge = chargeSandbox({ amount: plan.price, idempotencyKey });

    const [pkg] = await Package.create(
      [
        {
          customer: customerId,
          planCode: plan.code,
          planName: plan.name,
          sessionsTotal: plan.sessions,
          pricePaid: plan.price,
        },
      ],
      { session }
    );

    await Payment.create(
      [
        {
          customer: customerId,
          kind: PAYMENT_KINDS.PACKAGE_PURCHASE,
          method: PAYMENT_METHODS.SANDBOX_CARD,
          amount: plan.price,
          idempotencyKey,
          requestHash,
          reference: charge.reference,
          package: pkg._id,
        },
      ],
      { session }
    );

    result = { pkg, replayed: false };
  });

  return { package: serializePackage(result.pkg), replayed: result.replayed };
}

// Takes one session from the oldest package that still has any left. The condition and
// the increment are one atomic update, so the balance can never go below zero.
export function consumeSession(customerId, session) {
  return Package.findOneAndUpdate(
    { customer: customerId, $expr: { $lt: ["$sessionsUsed", "$sessionsTotal"] } },
    { $inc: { sessionsUsed: 1 } },
    { sort: { createdAt: 1 }, session, returnDocument: "after" }
  );
}

export function restoreSession(packageId, session) {
  return Package.updateOne(
    { _id: packageId, sessionsUsed: { $gt: 0 } },
    { $inc: { sessionsUsed: -1 } },
    { session }
  );
}