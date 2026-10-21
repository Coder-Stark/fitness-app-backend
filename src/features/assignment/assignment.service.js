import { distanceKm } from "../../shared/utils/geo.js";
import { overlaps, toLocal } from "../../shared/utils/time.js";
import { coversSession, getSchedulesForTrainers } from "../availability/availability.service.js";
import { Booking } from "../bookings/booking.model.js";
import { listActiveTrainersInZone } from "../trainers/trainer.service.js";

// Loads everything needed to decide who is free, in three reads (kept sequential so
// it is safe inside a transaction).
export async function loadSchedulingData(
  zoneId,
  rangeStart,
  rangeEnd,
  session = null,
  excludeBookingId = null
) {
  const trainers = await listActiveTrainersInZone(zoneId, session);
  if (trainers.length === 0) return [];

  const ids = trainers.map((trainer) => trainer._id);
  const schedules = await getSchedulesForTrainers(ids, session);
  const bookings = await Booking.findActiveForTrainers(
    ids,
    rangeStart,
    rangeEnd,
    session,
    excludeBookingId
  );

  return trainers.map((trainer) => ({
    id: String(trainer._id),
    userId: trainer.user?._id ? String(trainer.user._id) : null,
    name: trainer.user?.name ?? "Trainer",
    location: trainer.location,
    schedule: schedules.get(String(trainer._id)) ?? [],
    bookings: bookings.filter((booking) => String(booking.trainer) === String(trainer._id)),
  }));
}

export const isFree = (trainer, start, end) =>
  coversSession(trainer.schedule, start, end) &&
  !trainer.bookings.some((booking) => overlaps(start, end, booking.startTime, booking.endTime));

export const findEligibleTrainers = (data, start, end) =>
  data.filter((trainer) => isFree(trainer, start, end));

const dailyLoad = (trainer, slotStart) => {
  const dateKey = toLocal(slotStart).dateKey;
  return trainer.bookings.filter((booking) => toLocal(booking.startTime).dateKey === dateKey)
    .length;
};

const round2 = (value) => Math.round(value * 100) / 100;

// nearest first, then least busy that day, then trainer id so the result is deterministic
const byRank = (a, b) =>
  a.distanceKm - b.distanceKm || a.load - b.load || a.trainer.id.localeCompare(b.trainer.id);

export function chooseTrainer({
  eligible,
  customerLocation,
  preferredTrainerId = null,
  slotStart,
}) {
  const scored = eligible.map((trainer) => ({
    trainer,
    distanceKm: round2(distanceKm(customerLocation, trainer.location)),
    load: dailyLoad(trainer, slotStart),
  }));

  const preferred = preferredTrainerId
    ? scored.find((item) => item.trainer.id === String(preferredTrainerId))
    : null;

  if (preferred) {
    return {
      trainer: preferred.trainer,
      reason: {
        strategy: "preferred_trainer",
        preferredTrainer: preferredTrainerId,
        preferredHonoured: true,
        eligibleCount: scored.length,
        distanceKm: preferred.distanceKm,
        dailyLoad: preferred.load,
        tieBreaker: null,
        summary: `Preferred trainer was eligible and free (${preferred.distanceKm} km away).`,
      },
    };
  }

  scored.sort(byRank);
  const best = scored[0];

  const sameDistance = scored.filter((item) => item.distanceKm === best.distanceKm);
  let tieBreaker = null;
  if (sameDistance.length > 1) {
    const sameLoad = sameDistance.filter((item) => item.load === best.load);
    tieBreaker = sameLoad.length === 1 ? "least_busy" : "trainer_id";
  }

  const prefix = preferredTrainerId ? "Preferred trainer was not available. " : "";
  const count = scored.length;
  const tieNote = tieBreaker
    ? ` Distance tie resolved by ${tieBreaker === "least_busy" ? "least busy trainer" : "trainer id"}.`
    : "";

  return {
    trainer: best.trainer,
    reason: {
      strategy: "nearest_available",
      preferredTrainer: preferredTrainerId,
      preferredHonoured: false,
      eligibleCount: count,
      distanceKm: best.distanceKm,
      dailyLoad: best.load,
      tieBreaker,
      summary: `${prefix}Nearest of ${count} eligible trainer${count === 1 ? "" : "s"} (${best.distanceKm} km away).${tieNote}`,
    },
  };
}