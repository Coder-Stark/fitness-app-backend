import crypto from "node:crypto";
import { AppError } from "../../shared/utils/AppError.js";
import { Payment } from "./payment.model.js";

export const hashRequest = (payload) =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export const findPaymentByKey = (customerId, idempotencyKey, session = null) =>
  Payment.findOne({ customer: customerId, idempotencyKey }).session(session);

export function assertSameRequest(payment, requestHash) {
  if (payment.requestHash !== requestHash) {
    throw new AppError("This Idempotency-Key was already used with a different request", 422, {
      code: "IDEMPOTENCY_KEY_REUSED",
    });
  }
}

// Simulated gateway: no network call and no real money. The same key always gives the
// same reference, like a real gateway honouring an idempotency key.
export function chargeSandbox({ amount, idempotencyKey, outcome = "success" }) {
  if (outcome === "decline") {
    throw new AppError("Payment was declined by the card issuer (sandbox)", 402, {
      code: "PAYMENT_DECLINED",
    });
  }
  return { reference: `sbx_${hashRequest({ idempotencyKey, amount }).slice(0, 16)}` };
}