import { getTrainerProfileOrThrow } from "../trainers/trainer.service.js";
import * as availabilityService from "./availability.service.js";

export async function getMine(req, res) {
  const trainer = await getTrainerProfileOrThrow(req.user.id);
  const weeklySchedule = await availabilityService.getScheduleByTrainerId(trainer._id);
  res.json({ weeklySchedule });
}

export async function updateMine(req, res) {
  const trainer = await getTrainerProfileOrThrow(req.user.id);
  const weeklySchedule = await availabilityService.replaceSchedule(
    trainer._id,
    req.body.weeklySchedule
  );
  res.json({ weeklySchedule });
}