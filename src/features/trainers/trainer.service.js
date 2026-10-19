import { Trainer } from "./trainer.model.js";

export function findTrainerByUserId(userId) {
  return Trainer.findOne({ user: userId }).populate("zone", "name center radiusKm");
}