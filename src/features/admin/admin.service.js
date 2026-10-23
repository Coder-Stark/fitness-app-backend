import { istDayEnd, istDayStart, toLocal } from "../../shared/utils/time.js";
import { BOOKING_STATUS } from "../bookings/booking.constants.js";
import { Booking } from "../bookings/booking.model.js";
import { getPhaseFilter, getSessionPhase, SESSION_PHASES } from "../sessions/session.state.js";
import { countActiveTrainers } from "../trainers/trainer.service.js";
import { ROLES } from "../users/user.constants.js";
import { countUsersByRole } from "../users/user.service.js";

const POPULATE = [
  { path: "customer", select: "name" },
  { path: "zone", select: "name" },
  { path: "trainer", select: "user", populate: { path: "user", select: "name" } },
];

function serializeRow(booking, now) {
  return {
    id: booking._id,
    mode: booking.mode,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    phase: getSessionPhase(booking, now),
    customer: booking.customer?.name
      ? { id: booking.customer._id, name: booking.customer.name }
      : null,
    trainer: booking.trainer?.user
      ? { id: booking.trainer._id, name: booking.trainer.user.name }
      : null,
    zone: booking.zone?.name ? { id: booking.zone._id, name: booking.zone.name } : null,
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
    timer: booking.timer
      ? {
          startedAt: booking.timer.startedAt,
          endsAt: booking.timer.endsAt,
          completedAt: booking.timer.completedAt,
        }
      : null,
    createdAt: booking.createdAt,
  };
}

export async function listBookings(query) {
  const now = new Date();
  const { phase, from, to, trainerId, page, limit } = query;

  const filter = { ...getPhaseFilter(phase, now) };
  if (trainerId) filter.trainer = trainerId;
  if (from || to) {
    filter.startTime = {
      ...(from && { $gte: istDayStart(from) }),
      ...(to && { $lt: istDayEnd(to) }),
    };
  }

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .sort({ startTime: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
  ]);

  return {
    bookings: bookings.map((booking) => serializeRow(booking, now)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSummary() {
  const now = new Date();
  const today = toLocal(now).dateKey;
  const phases = Object.values(SESSION_PHASES);

  const [phaseCounts, todaySessions, customers, activeTrainers] = await Promise.all([
    Promise.all(phases.map((phase) => Booking.countDocuments(getPhaseFilter(phase, now)))),
    Booking.countDocuments({
      status: { $ne: BOOKING_STATUS.CANCELLED },
      startTime: { $gte: istDayStart(today), $lt: istDayEnd(today) },
    }),
    countUsersByRole(ROLES.CUSTOMER),
    countActiveTrainers(),
  ]);

  const byPhase = Object.fromEntries(phases.map((phase, index) => [phase, phaseCounts[index]]));

  return {
    // every booking is in exactly one phase, so the phases add up to the total
    bookings: { total: phaseCounts.reduce((sum, count) => sum + count, 0), ...byPhase },
    today: { date: today, sessions: todaySessions },
    people: { customers, activeTrainers },
  };
}