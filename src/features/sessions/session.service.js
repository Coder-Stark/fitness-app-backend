import mongoose from "mongoose";
import { AppError } from "../../shared/utils/AppError.js";
import { addMinutes, formatSlot } from "../../shared/utils/time.js";
import { BOOKING_STATUS } from "../bookings/booking.constants.js";
import { Booking } from "../bookings/booking.model.js";
import { notifySessionStarted } from "../notifications/notification.service.js";
import { getTrainerProfileOrThrow, lockTrainer } from "../trainers/trainer.service.js";
import { ROLES } from "../users/user.constants.js";
import { findUserById } from "../users/user.service.js";
import { sessionConfig } from "./session.config.js";
import { describeSession, getStartWindow } from "./session.state.js";

const POPULATE = [
  { path: "customer", select: "name" },
  { path: "trainer", select: "user", populate: { path: "user", select: "name" } },
];

function buildView(booking, now) {
  return {
    bookingId: booking._id,
    mode: booking.mode,
    customer: booking.customer?.name
      ? { id: booking.customer._id, name: booking.customer.name }
      : null,
    trainer: booking.trainer?.user
      ? { id: booking.trainer._id, name: booking.trainer.user.name }
      : null,
    ...describeSession(booking, now),
  };
}

export async function getSessionForUser(user, bookingId) {
  const filter = { _id: bookingId };

  if (user.role === ROLES.TRAINER) {
    const trainer = await getTrainerProfileOrThrow(user.id);
    filter.trainer = trainer._id;
  } else {
    filter.customer = user.id;
  }

  const booking = await Booking.findOne(filter).populate(POPULATE).lean();
  if (!booking) throw new AppError("Session not found", 404);

  const now = new Date();
  return { session: buildView(booking, now), serverTime: now.toISOString() };
}

export async function startSession(trainerUserId, bookingId) {
  const trainer = await getTrainerProfileOrThrow(trainerUserId);
  const trainerUser = await findUserById(trainerUserId);
  let alreadyStarted = false;

  await mongoose.connection.transaction(async (session) => {
    alreadyStarted = false; // the callback can run again after a write conflict
    const now = new Date();

    const booking = await Booking.findOne({ _id: bookingId, trainer: trainer._id }).session(
      session
    );
    if (!booking) throw new AppError("Booking not found", 404);

    // Pressing Start twice (double tap, retry) returns the same timer and changes nothing
    if (booking.status === BOOKING_STATUS.IN_PROGRESS) {
      alreadyStarted = true;
      return;
    }
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new AppError("This session was cancelled", 409, { code: "SESSION_CANCELLED" });
    }
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      throw new AppError("This session is already completed", 409, { code: "SESSION_COMPLETED" });
    }

    const { opensAt, closesAt } = getStartWindow(booking);
    if (now < opensAt) {
      throw new AppError(`This session can be started from ${formatSlot(opensAt)}`, 409, {
        code: "TOO_EARLY",
        opensAt: opensAt.toISOString(),
      });
    }
    if (now > closesAt) {
      throw new AppError("The start window for this session has closed", 409, {
        code: "START_WINDOW_CLOSED",
        closedAt: closesAt.toISOString(),
      });
    }

    await lockTrainer(trainer._id, session);

    const busy = await Booking.exists({
      trainer: trainer._id,
      status: BOOKING_STATUS.IN_PROGRESS,
      "timer.endsAt": { $gt: now },
    }).session(session);
    if (busy) {
      throw new AppError("You already have a session in progress", 409, { code: "TRAINER_BUSY" });
    }

    // The server's clock decides every timestamp, nothing comes from the client
    const warningAt = addMinutes(now, sessionConfig.warningAfterMinutes);
    const endsAt = addMinutes(now, sessionConfig.durationMinutes);

    // Conditional update: a cancel that got here first makes this fail
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: BOOKING_STATUS.CONFIRMED },
      {
        $set: {
          status: BOOKING_STATUS.IN_PROGRESS,
          timer: {
            startedAt: now,
            warningAt,
            endsAt,
            startedBy: trainerUserId,
            warningSentAt: null,
            completedAt: null,
          },
        },
      },
      { session, returnDocument: "after" }
    );
    if (!updated) throw new AppError("This booking was just changed. Please refresh.", 409);

    await notifySessionStarted(session, {
      customerId: booking.customer,
      trainerName: trainerUser?.name ?? "Your trainer",
      bookingId: booking._id,
    });
  });

  const fresh = await Booking.findById(bookingId).populate(POPULATE).lean();
  const now = new Date();
  return { session: buildView(fresh, now), serverTime: now.toISOString(), alreadyStarted };
}