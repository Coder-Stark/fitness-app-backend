import mongoose from "mongoose";
import { AppError } from "../../shared/utils/AppError.js";
import {
  addMinutes,
  DAY_MS,
  istDayEnd,
  istDayStart,
  MINUTE_MS,
  toLocal,
} from "../../shared/utils/time.js";
import {
  chooseTrainer,
  findEligibleTrainers,
  loadSchedulingData,
} from "../assignment/assignment.service.js";
import { consumeSession, restoreSession } from "../packages/package.service.js";
import { PAYMENT_KINDS, PAYMENT_METHODS, PAYMENT_STATUS } from "../payments/payment.constants.js";
import { Payment } from "../payments/payment.model.js";
import {
  assertSameRequest,
  chargeSandbox,
  findPaymentByKey,
  hashRequest,
} from "../payments/payment.service.js";
import { calculatePrice } from "../pricing/pricing.service.js";
import { computeInstantStart, findAlternativeSlots } from "../slots/slot.service.js";
import {
  notifyAssigned,
  notifyCancelled,
  notifyMovedAway,
  notifyRescheduled,
} from "../notifications/notification.service.js";
import {
  getTrainerProfileOrThrow,
  getTrainerUserId,
  lockTrainer,
} from "../trainers/trainer.service.js";
import { findUserById, getCustomerWithZone, lockUser } from "../users/user.service.js";
import { bookingConfig } from "./booking.config.js";
import { ACTIVE_BOOKING_STATUSES, BOOKING_MODES, BOOKING_STATUS } from "./booking.constants.js";
import { Booking } from "./booking.model.js";

const POPULATE_TRAINER = { path: "trainer", select: "user", populate: { path: "user", select: "name" } };

function serializeBooking(booking) {
  return {
    id: booking._id,
    mode: booking.mode,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    price: booking.price,
    assignment: booking.assignment,
    payment: booking.payment
      ? {
          method: booking.payment.method,
          amountPaid: booking.payment.amountPaid,
          status: booking.payment.status,
        }
      : null,
    cancellation: booking.cancellation ?? null,
    rescheduleCount: booking.rescheduleHistory?.length ?? 0,
    rescheduleHistory: (booking.rescheduleHistory ?? []).map((entry) => ({
      previousStartTime: entry.previousStartTime,
      previousEndTime: entry.previousEndTime,
      rescheduledAt: entry.rescheduledAt,
    })),
    trainer: booking.trainer?.user
      ? { id: booking.trainer._id, name: booking.trainer.user.name }
      : null,
    customer: booking.customer?.name
      ? { id: booking.customer._id, name: booking.customer.name }
      : undefined,
  };
}

function resolveScheduledStart(isoString, now) {
  const start = new Date(isoString);
  const stepMs = bookingConfig.slotStepMinutes * 60_000;
  const dayStart = istDayStart(toLocal(start).dateKey);

  if ((start - dayStart) % stepMs !== 0) {
    throw new AppError(
      `Slots start on a ${bookingConfig.slotStepMinutes}-minute boundary (IST), e.g. 10:00`,
      400
    );
  }
  if (start < addMinutes(now, bookingConfig.scheduledMinLeadMinutes)) {
    throw new AppError(
      `Scheduled sessions must start at least ${bookingConfig.scheduledMinLeadMinutes} minutes from now. Use an instant booking for sooner sessions.`,
      400
    );
  }
  if (start > new Date(now.getTime() + bookingConfig.maxAdvanceDays * DAY_MS)) {
    throw new AppError(`Sessions can be booked up to ${bookingConfig.maxAdvanceDays} days ahead`, 400);
  }
  return start;
}

export async function createBooking(customerId, input, idempotencyKey) {
  const requestHash = hashRequest({
    type: "booking",
    mode: input.mode,
    startTime:
      input.mode === BOOKING_MODES.SCHEDULED ? new Date(input.startTime).toISOString() : null,
    preferredTrainerId: input.preferredTrainerId ?? null,
    paymentMethod: input.paymentMethod,
  });

  // A retry of a request that already succeeded returns the original booking
  const prior = await findPaymentByKey(customerId, idempotencyKey);
  if (prior) return replayBooking(prior, requestHash);

  const customer = await getCustomerWithZone(customerId);
  const zoneId = customer.zone._id;
  const customerLocation = customer.location ?? customer.zone.center;

  const now = new Date();
  const start =
    input.mode === BOOKING_MODES.INSTANT
      ? computeInstantStart(now)
      : resolveScheduledStart(input.startTime, now);
  const end = addMinutes(start, bookingConfig.sessionMinutes);
  const dateKey = toLocal(start).dateKey;

  // Price is always computed here, never taken from the client.
  const price = calculatePrice(start);

  let booking = null;
  let noTrainer = false;
  let replayedPayment = null;

  await mongoose.connection.transaction(async (session) => {
    booking = null; // the callback can run again after a write conflict
    noTrainer = false;
    replayedPayment = null;

    await lockUser(customer._id, session);

    // Checked again inside the lock: a simultaneous duplicate may have just committed
    const existing = await findPaymentByKey(customer._id, idempotencyKey, session);
    if (existing) {
      assertSameRequest(existing, requestHash);
      replayedPayment = existing;
      return;
    }

    const clash = await Booking.exists({
      customer: customer._id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).session(session);
    if (clash) {
      throw new AppError("You already have a session that overlaps this time", 409, {
        code: "CUSTOMER_OVERLAP",
      });
    }

    const data = await loadSchedulingData(zoneId, istDayStart(dateKey), istDayEnd(dateKey), session);
    const eligible = findEligibleTrainers(data, start, end);
    if (eligible.length === 0) {
      noTrainer = true;
      return;
    }

    const { trainer, reason } = chooseTrainer({
      eligible,
      customerLocation,
      preferredTrainerId: input.preferredTrainerId ?? null,
      slotStart: start,
    });

    await lockTrainer(trainer.id, session);

    let amountPaid = 0;
    let packageId = null;
    let reference = null;

    if (input.paymentMethod === PAYMENT_METHODS.PACKAGE) {
      const pkg = await consumeSession(customer._id, session);
      if (!pkg) {
        throw new AppError(
          "You have no package sessions left. Buy a package or pay by card.",
          402,
          { code: "NO_PACKAGE_BALANCE" }
        );
      }
      packageId = pkg._id;
    } else {
      // The amount is always the server-calculated total, never a client value
      ({ reference } = chargeSandbox({
        amount: price.total,
        idempotencyKey,
        outcome: input.sandboxOutcome,
      }));
      amountPaid = price.total;
    }

    const bookingId = new mongoose.Types.ObjectId();
    const paymentId = new mongoose.Types.ObjectId();

    [booking] = await Booking.create(
      [
        {
          _id: bookingId,
          customer: customer._id,
          trainer: trainer.id,
          zone: zoneId,
          mode: input.mode,
          startTime: start,
          endTime: end,
          price,
          assignment: reason,
          payment: {
            method: input.paymentMethod,
            amountPaid,
            status: "paid",
            paymentId,
            packageId,
          },
        },
      ],
      { session }
    );

    await Payment.create(
      [
        {
          _id: paymentId,
          customer: customer._id,
          kind: PAYMENT_KINDS.SESSION,
          method: input.paymentMethod,
          amount: amountPaid,
          idempotencyKey,
          requestHash,
          reference,
          booking: bookingId,
          package: packageId,
        },
      ],
      { session }
    );

    await notifyAssigned(session, {
      trainerUserId: trainer.userId,
      bookingId,
      customerName: customer.name,
      startTime: start,
    });
  });

  if (replayedPayment) return replayBooking(replayedPayment, requestHash);

  if (noTrainer) {
    const alternatives = await findAlternativeSlots(zoneId, start);
    throw new AppError("No trainer is available for this time", 409, {
      code: "NO_TRAINER_AVAILABLE",
      alternatives,
    });
  }

  await booking.populate(POPULATE_TRAINER);
  return { booking: serializeBooking(booking), replayed: false };
}

async function replayBooking(payment, requestHash) {
  assertSameRequest(payment, requestHash);
  const booking = await Booking.findById(payment.booking).populate(POPULATE_TRAINER);
  return { booking: serializeBooking(booking), replayed: true };
}

export async function listMyBookings(customerId) {
  const bookings = await Booking.find({ customer: customerId })
    .sort({ startTime: -1 })
    .populate(POPULATE_TRAINER)
    .lean();
  return bookings.map(serializeBooking);
}

export async function listAssignedBookings(userId) {
  const trainer = await getTrainerProfileOrThrow(userId);
  const bookings = await Booking.find({ trainer: trainer._id })
    .sort({ startTime: 1 })
    .populate("customer", "name")
    .lean();
  // trainers don't need to see how the customer paid
  return bookings.map((booking) => ({ ...serializeBooking(booking), payment: undefined }));
}


export async function cancelBooking(customerId, bookingId, reason) {
  const customer = await findUserById(customerId);
  let result = null;

  await mongoose.connection.transaction(async (session) => {
    result = null; // the callback can run again after a write conflict

    const booking = await Booking.findOne({ _id: bookingId, customer: customerId }).session(session);
    if (!booking) throw new AppError("Booking not found", 404);

    // Cancelling twice changes nothing, so a retry can't restore a session twice
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      result = { booking, alreadyCancelled: true };
      return;
    }
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new AppError("Only upcoming sessions can be cancelled", 409, { code: "NOT_CANCELLABLE" });
    }

    const now = new Date();
    if (booking.startTime <= now) {
      throw new AppError("This session's start time has passed, so it can no longer be cancelled", 409, {
        code: "NOT_CANCELLABLE",
      });
    }

    const refundable =
      booking.startTime.getTime() - now.getTime() >= bookingConfig.freeCancellationMinutes * MINUTE_MS;
    const isPackage = booking.payment.method === PAYMENT_METHODS.PACKAGE;

    let outcome = "no_refund";
    if (refundable) outcome = isPackage ? "session_restored" : "amount_refunded";

    // Conditional update: only one of two simultaneous cancels can win this
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: BOOKING_STATUS.CONFIRMED },
      {
        $set: {
          status: BOOKING_STATUS.CANCELLED,
          "payment.status": refundable ? "refunded" : "not_refunded",
          cancellation: {
            cancelledAt: now,
            cancelledBy: customerId,
            reason: reason ?? null,
            refundable,
            outcome,
          },
        },
      },
      { session, returnDocument: "after" }
    );
    if (!updated) throw new AppError("This booking was just changed. Please refresh.", 409);

    if (refundable && isPackage) {
      await restoreSession(booking.payment.packageId, session);
    }
    if (refundable && !isPackage) {
      await Payment.updateOne(
        { _id: booking.payment.paymentId },
        { status: PAYMENT_STATUS.REFUNDED, refundedAt: now, refundedAmount: booking.payment.amountPaid },
        { session }
      );
    }

    const trainerUserId = await getTrainerUserId(booking.trainer, session);
    if (trainerUserId) {
      await notifyCancelled(session, {
        trainerUserId,
        bookingId: booking._id,
        customerName: customer.name,
        startTime: booking.startTime,
      });
    }

    result = { booking: updated, alreadyCancelled: false };
  });

  await result.booking.populate(POPULATE_TRAINER);
  return { booking: serializeBooking(result.booking), alreadyCancelled: result.alreadyCancelled };
}


export async function rescheduleBooking(customerId, bookingId, input) {
  const customer = await getCustomerWithZone(customerId);
  const zoneId = customer.zone._id;
  const customerLocation = customer.location ?? customer.zone.center;

  const now = new Date();
  const newStart = resolveScheduledStart(input.startTime, now);
  const newEnd = addMinutes(newStart, bookingConfig.sessionMinutes);
  const dateKey = toLocal(newStart).dateKey;
  const newPrice = calculatePrice(newStart);
  const explicitTrainerId = input.preferredTrainerId ?? null;

  let outcome = null;
  let noTrainer = false;

  await mongoose.connection.transaction(async (session) => {
    outcome = null; // the callback can run again after a write conflict
    noTrainer = false;

    await lockUser(customer._id, session);

    const booking = await Booking.findOne({ _id: bookingId, customer: customer._id }).session(
      session
    );
    if (!booking) throw new AppError("Booking not found", 404);

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new AppError("Only upcoming sessions can be rescheduled", 409, {
        code: "NOT_RESCHEDULABLE",
      });
    }

    // A retry of a reschedule that already went through changes nothing
    if (booking.startTime.getTime() === newStart.getTime()) {
      outcome = { bookingId: booking._id, unchanged: true };
      return;
    }

    const notice = booking.startTime.getTime() - now.getTime();
    if (notice < bookingConfig.rescheduleNoticeMinutes * MINUTE_MS) {
      throw new AppError(
        `Sessions can only be rescheduled at least ${bookingConfig.rescheduleNoticeMinutes} minutes before they start`,
        409,
        { code: "TOO_LATE_TO_RESCHEDULE" }
      );
    }

    if ((booking.rescheduleHistory?.length ?? 0) >= bookingConfig.maxReschedules) {
      throw new AppError(
        `A session can be rescheduled at most ${bookingConfig.maxReschedules} times`,
        409,
        { code: "RESCHEDULE_LIMIT" }
      );
    }

    // Card sessions keep the price they paid, so they can only move to the same price type
    const isPackage = booking.payment.method === PAYMENT_METHODS.PACKAGE;
    if (!isPackage && newPrice.slotType !== booking.price.slotType) {
      throw new AppError(
        "A card-paid session can only move to a slot with the same price type (normal or peak). Cancel and rebook instead.",
        409,
        { code: "PRICE_TYPE_MISMATCH" }
      );
    }

    const clash = await Booking.exists({
      _id: { $ne: booking._id },
      customer: customer._id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      startTime: { $lt: newEnd },
      endTime: { $gt: newStart },
    }).session(session);
    if (clash) {
      throw new AppError("You already have a session that overlaps this time", 409, {
        code: "CUSTOMER_OVERLAP",
      });
    }

    // The booking being moved is left out, so its old slot never blocks its new one
    const data = await loadSchedulingData(
      zoneId,
      istDayStart(dateKey),
      istDayEnd(dateKey),
      session,
      booking._id
    );
    const eligible = findEligibleTrainers(data, newStart, newEnd);
    if (eligible.length === 0) {
      noTrainer = true;
      return;
    }

    // Keep the current trainer when free, unless the customer named a different one
    const currentTrainerId = String(booking.trainer);
    const keepCurrent = !explicitTrainerId && eligible.some((item) => item.id === currentTrainerId);

    const { trainer, reason } = chooseTrainer({
      eligible,
      customerLocation,
      preferredTrainerId: keepCurrent ? currentTrainerId : explicitTrainerId,
      slotStart: newStart,
    });

    let assignment = reason;
    if (keepCurrent) {
      assignment = {
        ...reason,
        strategy: "kept_current_trainer",
        preferredTrainer: null,
        preferredHonoured: false,
        summary: `Kept your current trainer for the new time (${reason.distanceKm} km away).`,
      };
    } else if (!explicitTrainerId) {
      assignment = {
        ...reason,
        summary: `Your previous trainer was not available at the new time. ${reason.summary}`,
      };
    }

    await lockTrainer(trainer.id, session);

    // Conditional update: a cancel or another reschedule that got here first makes this fail
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: BOOKING_STATUS.CONFIRMED, startTime: booking.startTime },
      {
        $set: {
          startTime: newStart,
          endTime: newEnd,
          trainer: trainer.id,
          assignment,
          ...(isPackage && { price: newPrice }),
        },
        $push: {
          rescheduleHistory: {
            previousStartTime: booking.startTime,
            previousEndTime: booking.endTime,
            previousTrainer: booking.trainer,
            rescheduledAt: now,
          },
        },
      },
      { session, returnDocument: "after" }
    );
    if (!updated) throw new AppError("This booking was just changed. Please refresh.", 409);

    if (trainer.id === currentTrainerId) {
      await notifyRescheduled(session, {
        trainerUserId: trainer.userId,
        bookingId: booking._id,
        customerName: customer.name,
        previousStartTime: booking.startTime,
        startTime: newStart,
      });
    } else {
      const previousUserId = await getTrainerUserId(booking.trainer, session);
      if (previousUserId) {
        await notifyMovedAway(session, {
          trainerUserId: previousUserId,
          bookingId: booking._id,
          customerName: customer.name,
          previousStartTime: booking.startTime,
        });
      }
      await notifyAssigned(session, {
        trainerUserId: trainer.userId,
        bookingId: booking._id,
        customerName: customer.name,
        startTime: newStart,
      });
    }

    outcome = { bookingId: booking._id, unchanged: false };
  });

  if (noTrainer) {
    const alternatives = await findAlternativeSlots(zoneId, newStart);
    throw new AppError(
      "No trainer is available for the new time. Your current booking is unchanged.",
      409,
      { code: "NO_TRAINER_AVAILABLE", alternatives }
    );
  }

  const fresh = await Booking.findById(outcome.bookingId).populate(POPULATE_TRAINER).lean();
  return { booking: serializeBooking(fresh), unchanged: outcome.unchanged };
}