import { AppError } from "../../shared/utils/AppError.js";
import { lockDocument } from "../../shared/utils/lock.js";
import { Trainer } from "./trainer.model.js";

export function findTrainerByUserId(userId) {
  return Trainer.findOne({ user: userId }).populate("zone", "name center radiusKm");
}

export async function getTrainerProfileOrThrow(userId) {
  const trainer = await Trainer.findOne({ user: userId });
  if (!trainer) throw new AppError("Trainer profile not found", 404);
  return trainer;
}

export function listActiveTrainersInZone(zoneId, session = null) {
  return Trainer.find({ zone: zoneId, isActive: true })
    .populate("user", "name")
    .session(session)
    .lean();
}

export const lockTrainer = (trainerId, session) => lockDocument(Trainer, trainerId, session);

export async function getTrainerUserId(trainerId, session = null) {
  const trainer = await Trainer.findById(trainerId).select("user").session(session).lean();
  return trainer?.user ?? null;
}

export function getTrainerWithUser(trainerId, session = null) {
  return Trainer.findById(trainerId).populate("user", "name").session(session).lean();
}