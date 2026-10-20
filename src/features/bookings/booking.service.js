import mongoose from "mongoose";
import { AppError } from "../../shared/utils/AppError.js";
import { addMinutes, DAY_MS, istDayEnd, istDayStart, toLocal } from "../../shared/utils/time.js";
import {
  chooseTrainer,
  findEligibleTrainers,
  loadSchedulingData,
} from "../assignment/assignment.service.js";
import { calculatePrice } from "../pricing/pricing.service.js";
import { computeInstantStart, findAlternativeSlots } from "../slots/slot.service.js";
import { getTrainerProfileOrThrow, lockTrainer } from "../trainers/trainer.service.js";
import { getCustomerWithZone, lockUser } from "../users/user.service.js";
import { bookingConfig } from "./booking.config.js";
import { ACTIVE_BOOKING_STATUSES, BOOKING_MODES } from "./booking.constants.js";
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

export async function createBooking(customerId, input) {
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

  await mongoose.connection.transaction(async (session) => {
    booking = null; // the callback can run again after a write conflict
    noTrainer = false;

    await lockUser(customer._id, session);

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

    [booking] = await Booking.create(
      [
        {
          customer: customer._id,
          trainer: trainer.id,
          zone: zoneId,
          mode: input.mode,
          startTime: start,
          endTime: end,
          price,
          assignment: reason,
        },
      ],
      { session }
    );
  });

  if (noTrainer) {
    const alternatives = await findAlternativeSlots(zoneId, start);
    throw new AppError("No trainer is available for this time", 409, {
      code: "NO_TRAINER_AVAILABLE",
      alternatives,
    });
  }

  await booking.populate(POPULATE_TRAINER);
  return serializeBooking(booking);
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
  return bookings.map(serializeBooking);
}