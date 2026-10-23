import { AppError } from "../../shared/utils/AppError.js";
import { retryOnDuplicateKey } from "../../shared/utils/retry.js";
import { Booking } from "../bookings/booking.model.js";
import { getProfileByCustomerId } from "../fitnessProfiles/fitnessProfile.service.js";
import { getPhaseFilter, getSessionPhase, SESSION_PHASES } from "../sessions/session.state.js";
import { getTrainerProfileOrThrow } from "../trainers/trainer.service.js";
import { ROLES } from "../users/user.constants.js";
import { SessionRecord } from "./sessionRecord.model.js";

const POPULATE = [
  { path: "customer", select: "name" },
  { path: "trainer", select: "user", populate: { path: "user", select: "name" } },
];

const LIST_LIMIT = 100;

const minutesBetween = (from, to) => Math.max(1, Math.round((to - from) / 60_000));

function serializeRecord(record) {
  const entry = record.trainerEntry;
  const feedback = record.customerFeedback;

  return {
    id: record._id,
    bookingId: record.booking,
    sessionDate: record.sessionDate,
    durationMinutes: record.durationMinutes,
    trainerNotes: entry
      ? {
          exercises: (entry.exercises ?? []).map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets ?? null,
            reps: exercise.reps ?? null,
            durationMinutes: exercise.durationMinutes ?? null,
          })),
          notes: entry.notes ?? "",
          suggestedNextWorkout: entry.suggestedNextWorkout,
          submittedAt: entry.submittedAt,
        }
      : null,
    customerFeedback: feedback
      ? {
          rating: feedback.rating,
          comment: feedback.comment ?? "",
          submittedAt: feedback.submittedAt,
        }
      : null,
  };
}

function summarizeSession(booking, now) {
  return {
    bookingId: booking._id,
    mode: booking.mode,
    startTime: booking.startTime,
    endTime: booking.endTime,
    phase: getSessionPhase(booking, now),
    durationMinutes: booking.timer
      ? minutesBetween(booking.timer.startedAt, booking.timer.endsAt)
      : null,
    customer: booking.customer?.name
      ? { id: booking.customer._id, name: booking.customer.name }
      : null,
    trainer: booking.trainer?.user
      ? { id: booking.trainer._id, name: booking.trainer.user.name }
      : null,
  };
}

// A customer can only reach their own bookings, a trainer only the ones assigned to them
async function findOwnBooking(user, bookingId) {
  const filter = { _id: bookingId };

  if (user.role === ROLES.TRAINER) {
    const trainer = await getTrainerProfileOrThrow(user.id);
    filter.trainer = trainer._id;
  } else {
    filter.customer = user.id;
  }

  const booking = await Booking.findOne(filter).populate(POPULATE).lean();
  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
}

// Uses the derived phase, so a session that has just ended counts as complete even if the
// background worker has not updated its status yet
function assertCompleted(booking, message) {
  if (getSessionPhase(booking) !== SESSION_PHASES.COMPLETED || !booking.timer) {
    throw new AppError(message, 409, { code: "SESSION_NOT_COMPLETED" });
  }
}

// Writes one half of the record. The record is created if it does not exist yet, and the
// fixed details (people, date, duration) are set only on creation, from the saved timer.
function saveRecordPart(booking, part) {
  return retryOnDuplicateKey(() =>
    SessionRecord.findOneAndUpdate(
      { booking: booking._id },
      {
        $set: part,
        $setOnInsert: {
          customer: booking.customer._id,
          trainer: booking.trainer._id,
          sessionDate: booking.timer.startedAt,
          durationMinutes: minutesBetween(booking.timer.startedAt, booking.timer.endsAt),
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).lean()
  );
}

export async function saveTrainerNotes(user, bookingId, input) {
  const booking = await findOwnBooking(user, bookingId);
  assertCompleted(booking, "Session notes can only be added after the session is complete");

  const record = await saveRecordPart(booking, {
    trainerEntry: { ...input, submittedAt: new Date() },
  });
  return serializeRecord(record);
}

export async function saveFeedback(user, bookingId, input) {
  const booking = await findOwnBooking(user, bookingId);
  assertCompleted(booking, "Feedback can only be added after the session is complete");

  const record = await saveRecordPart(booking, {
    customerFeedback: { ...input, submittedAt: new Date() },
  });
  return serializeRecord(record);
}

export async function getSessionRecord(user, bookingId) {
  const booking = await findOwnBooking(user, bookingId);
  const now = new Date();
  const session = summarizeSession(booking, now);
  const record = await SessionRecord.findOne({ booking: booking._id }).lean();

  const result = {
    session,
    record: record ? serializeRecord(record) : null,
    canSubmit: session.phase === SESSION_PHASES.COMPLETED,
  };

  // A trainer sees the customer's assessment for their own, non-cancelled bookings only
  if (user.role === ROLES.TRAINER && session.phase !== SESSION_PHASES.CANCELLED) {
    result.customerProfile = await getProfileByCustomerId(booking.customer._id);
  }

  return result;
}

async function listCompleted(filter) {
  const now = new Date();

  const bookings = await Booking.find({
    ...filter,
    ...getPhaseFilter(SESSION_PHASES.COMPLETED, now),
  })
    .sort({ startTime: -1 })
    .limit(LIST_LIMIT)
    .populate(POPULATE)
    .lean();

  const records = await SessionRecord.find({
    booking: { $in: bookings.map((booking) => booking._id) },
  }).lean();
  const recordByBooking = new Map(records.map((record) => [String(record.booking), record]));

  return bookings.map((booking) => {
    const record = recordByBooking.get(String(booking._id));
    return { ...summarizeSession(booking, now), record: record ? serializeRecord(record) : null };
  });
}

export const listMine = (customerId) => listCompleted({ customer: customerId });

export async function listAssigned(trainerUserId) {
  const trainer = await getTrainerProfileOrThrow(trainerUserId);
  return listCompleted({ trainer: trainer._id });
}

// Used by the workout recommendation: the customer's newest records, trainer notes and feedback included
export async function getRecentRecordsForCustomer(customerId, limit) {
  const records = await SessionRecord.find({ customer: customerId })
    .sort({ sessionDate: -1 })
    .limit(limit)
    .lean();
  return records.map(serializeRecord);
}

export const countCompletedForCustomer = (customerId) =>
  Booking.countDocuments({
    customer: customerId,
    ...getPhaseFilter(SESSION_PHASES.COMPLETED, new Date()),
  });