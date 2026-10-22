import mongoose from "mongoose";
import { BOOKING_STATUS } from "../bookings/booking.constants.js";
import { Booking } from "../bookings/booking.model.js";
import {
  notifySessionCompleted,
  notifySessionWarning,
} from "../notifications/notification.service.js";
import { getTrainerWithUser } from "../trainers/trainer.service.js";
import { findUserById } from "../users/user.service.js";
import { sessionConfig } from "./session.config.js";

const BATCH_SIZE = 50;

let intervalId = null;
let running = false;

async function loadParties(booking, session) {
  const trainer = await getTrainerWithUser(booking.trainer, session);
  const customer = await findUserById(booking.customer);

  return {
    bookingId: booking._id,
    trainerUserId: trainer?.user?._id ?? null,
    trainerName: trainer?.user?.name ?? "your trainer",
    customerId: booking.customer,
    customerName: customer?.name ?? "the customer",
  };
}

// Each event is claimed with a conditional update. If two worker runs (or two servers)
// race, only one claim succeeds, so the event and its notifications happen exactly once.
// The claim and the notifications are saved together in one transaction.
async function completeOne(bookingId, now) {
  let claimed = false;

  await mongoose.connection.transaction(async (session) => {
    claimed = false; // the callback can run again after a write conflict

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: BOOKING_STATUS.IN_PROGRESS, "timer.endsAt": { $lte: now } },
      { $set: { status: BOOKING_STATUS.COMPLETED, "timer.completedAt": now } },
      { session, returnDocument: "after" }
    );
    if (!booking) return;

    claimed = true;
    await notifySessionCompleted(session, await loadParties(booking, session));
  });

  return claimed;
}

async function warnOne(bookingId, now) {
  let claimed = false;

  await mongoose.connection.transaction(async (session) => {
    claimed = false;

    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: BOOKING_STATUS.IN_PROGRESS,
        "timer.warningAt": { $lte: now },
        "timer.endsAt": { $gt: now },
        "timer.warningSentAt": null,
      },
      { $set: { "timer.warningSentAt": now } },
      { session, returnDocument: "after" }
    );
    if (!booking) return;

    claimed = true;
    const parties = await loadParties(booking, session);
    await notifySessionWarning(session, {
      ...parties,
      minutesLeft: sessionConfig.durationMinutes - sessionConfig.warningAfterMinutes,
    });
  });

  return claimed;
}

async function processDue(filter, handler) {
  const due = await Booking.find(filter).select("_id").limit(BATCH_SIZE).lean();
  let count = 0;

  for (const { _id } of due) {
    try {
      if (await handler(_id)) count += 1;
    } catch (err) {
      console.error(`Session worker failed for booking ${_id}:`, err);
    }
  }
  return count;
}

// Everything is decided from timestamps saved in the database, so after a restart the
// first run simply catches up on whatever was missed.
export async function runSessionTick(now = new Date()) {
  // A session that ended while the server was down is completed without a stale warning
  const completed = await processDue(
    { status: BOOKING_STATUS.IN_PROGRESS, "timer.endsAt": { $lte: now } },
    (id) => completeOne(id, now)
  );

  const warned = await processDue(
    {
      status: BOOKING_STATUS.IN_PROGRESS,
      "timer.warningAt": { $lte: now },
      "timer.endsAt": { $gt: now },
      "timer.warningSentAt": null,
    },
    (id) => warnOne(id, now)
  );

  return { completed, warned };
}

export function startSessionWorker() {
  if (intervalId) return;

  const tick = async () => {
    if (running) return; // never let two runs overlap
    running = true;
    try {
      const { completed, warned } = await runSessionTick(new Date());
      if (completed || warned) {
        console.log(`Session worker: ${warned} warning(s), ${completed} completion(s)`);
      }
    } catch (err) {
      console.error("Session worker error:", err);
    } finally {
      running = false;
    }
  };

  tick(); // catch up straight away after a restart
  intervalId = setInterval(tick, sessionConfig.workerIntervalMs);
}

export function stopSessionWorker() {
  clearInterval(intervalId);
  intervalId = null;
}