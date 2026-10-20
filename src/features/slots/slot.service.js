import { AppError } from "../../shared/utils/AppError.js";
import {
  addMinutes,
  DAY_MS,
  istDayEnd,
  istDayStart,
  MINUTE_MS,
  toLocal,
} from "../../shared/utils/time.js";
import { findEligibleTrainers, loadSchedulingData } from "../assignment/assignment.service.js";
import { bookingConfig } from "../bookings/booking.config.js";
import { calculatePrice } from "../pricing/pricing.service.js";
import { getCustomerWithZone } from "../users/user.service.js";

const toTrainerSummary = ({ id, name }) => ({ id, name });

export function computeInstantStart(now = new Date()) {
  const stepMs = bookingConfig.instantRoundMinutes * MINUTE_MS;
  const earliest = now.getTime() + bookingConfig.instantLeadMinutes * MINUTE_MS;
  return new Date(Math.ceil(earliest / stepMs) * stepMs);
}

// Walks the slot grid between `from` and `to` and keeps slots with at least one free trainer.
function buildSlots(data, from, to, now) {
  const stepMs = bookingConfig.slotStepMinutes * MINUTE_MS;
  const earliest = addMinutes(now, bookingConfig.scheduledMinLeadMinutes);
  const latest = new Date(now.getTime() + bookingConfig.maxAdvanceDays * DAY_MS);

  const lowerBound = from > earliest ? from : earliest;
  const origin = istDayStart(toLocal(lowerBound).dateKey);
  let cursor = new Date(origin.getTime() + Math.ceil((lowerBound - origin) / stepMs) * stepMs);

  const slots = [];
  while (cursor < to && cursor <= latest) {
    const end = addMinutes(cursor, bookingConfig.sessionMinutes);
    const eligible = findEligibleTrainers(data, cursor, end);

    if (eligible.length > 0) {
      slots.push({
        startTime: cursor.toISOString(),
        endTime: end.toISOString(),
        availableTrainers: eligible.map(toTrainerSummary),
        price: calculatePrice(cursor),
      });
    }
    cursor = new Date(cursor.getTime() + stepMs);
  }
  return slots;
}

export async function findAlternativeSlots(zoneId, after, limit = bookingConfig.alternativeSlotsLimit) {
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + (bookingConfig.maxAdvanceDays + 1) * DAY_MS);
  const rangeStart = istDayStart(toLocal(after > now ? after : now).dateKey);

  const data = await loadSchedulingData(zoneId, rangeStart, rangeEnd);
  return buildSlots(data, after, rangeEnd, now).slice(0, limit);
}

export async function getSlotsForDate(userId, dateKey) {
  const customer = await getCustomerWithZone(userId);
  const now = new Date();

  const today = toLocal(now).dateKey;
  const lastDay = toLocal(new Date(now.getTime() + bookingConfig.maxAdvanceDays * DAY_MS)).dateKey;
  if (dateKey < today || dateKey > lastDay) {
    throw new AppError(`Choose a date between ${today} and ${lastDay}`, 400);
  }

  const dayStart = istDayStart(dateKey);
  const dayEnd = istDayEnd(dateKey);
  const data = await loadSchedulingData(customer.zone._id, dayStart, dayEnd);

  return {
    date: dateKey,
    zone: { id: customer.zone._id, name: customer.zone.name },
    slots: buildSlots(data, dayStart, dayEnd, now),
  };
}

export async function getInstantOffer(userId) {
  const customer = await getCustomerWithZone(userId);
  const start = computeInstantStart(new Date());
  const end = addMinutes(start, bookingConfig.sessionMinutes);
  const dateKey = toLocal(start).dateKey;

  const data = await loadSchedulingData(
    customer.zone._id,
    istDayStart(dateKey),
    istDayEnd(dateKey)
  );
  const eligible = findEligibleTrainers(data, start, end);

  const offer = {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    price: calculatePrice(start),
    available: eligible.length > 0,
    availableTrainers: eligible.map(toTrainerSummary),
  };

  if (!offer.available) {
    offer.alternatives = await findAlternativeSlots(customer.zone._id, start);
  }
  return offer;
}