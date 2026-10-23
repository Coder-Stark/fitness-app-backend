import { getProfileByCustomerId } from "../fitnessProfiles/fitnessProfile.service.js";
import {
  countCompletedForCustomer,
  getRecentRecordsForCustomer,
} from "../sessionRecords/sessionRecord.service.js";
import { recommendationConfig } from "./recommendation.config.js";
import { buildRecommendation } from "./recommendation.rules.js";

export async function getRecommendation(customerId) {
  const profile = await getProfileByCustomerId(customerId);
  if (!profile) return { recommendation: null, requires: "profile" };

  const completedCount = await countCompletedForCustomer(customerId);
  const recentRecords = await getRecentRecordsForCustomer(
    customerId,
    recommendationConfig.recentRecordsLimit
  );

  return { recommendation: buildRecommendation({ profile, completedCount, recentRecords }) };
}