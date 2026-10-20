import { toLocal, toMinutes } from "../../shared/utils/time.js";
import { Availability } from "./availability.model.js";

export async function getScheduleByTrainerId(trainerId) {
  const doc = await Availability.findOne({ trainer: trainerId }).lean();
  return doc?.weeklySchedule ?? [];
}

export async function getSchedulesForTrainers(trainerIds, session = null) {
  const docs = await Availability.find({ trainer: { $in: trainerIds } })
    .session(session)
    .lean();
  return new Map(docs.map((doc) => [String(doc.trainer), doc.weeklySchedule]));
}

export async function replaceSchedule(trainerId, weeklySchedule) {
  const doc = await Availability.findOneAndUpdate(
    { trainer: trainerId },
    { weeklySchedule },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).lean();
  return doc.weeklySchedule;
}

// True when the whole session fits inside one working interval on one IST day.
export function coversSession(schedule, start, end) {
  const from = toLocal(start);
  const to = toLocal(end);
  if (from.dateKey !== to.dateKey) return false;

  return schedule.some(
    (interval) =>
      interval.day === from.day &&
      toMinutes(interval.start) <= from.minutes &&
      to.minutes <= toMinutes(interval.end)
  );
}