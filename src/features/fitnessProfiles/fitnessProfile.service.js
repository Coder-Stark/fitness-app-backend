import { retryOnDuplicateKey } from "../../shared/utils/retry.js";
import { FitnessProfile } from "./fitnessProfile.model.js";

function serialize(profile) {
  return {
    id: profile._id,
    age: profile.age,
    weightKg: profile.weightKg,
    goals: profile.goals,
    level: profile.level,
    preferences: {
      workoutTypes: profile.preferences.workoutTypes,
      intensity: profile.preferences.intensity,
      equipment: profile.preferences.equipment,
      healthNotes: profile.preferences.healthNotes ?? "",
    },
    updatedAt: profile.updatedAt,
  };
}

// Returns null when the customer has not filled in their assessment yet
export async function getProfileByCustomerId(customerId) {
  const profile = await FitnessProfile.findOne({ customer: customerId }).lean();
  return profile ? serialize(profile) : null;
}

// Creates the profile the first time and replaces it afterwards. The owner always comes
// from the login token, never from the request body.
export async function saveProfile(customerId, input) {
  const profile = await retryOnDuplicateKey(() =>
    FitnessProfile.findOneAndUpdate(
      { customer: customerId },
      { $set: input },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).lean()
  );
  return serialize(profile);
}