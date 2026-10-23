import * as recommendationService from "./recommendation.service.js";

export async function getMine(req, res) {
  res.json(await recommendationService.getRecommendation(req.user.id));
}