import * as profileService from "./fitnessProfile.service.js";

export async function getMine(req, res) {
  res.json({ profile: await profileService.getProfileByCustomerId(req.user.id) });
}

export async function saveMine(req, res) {
  res.json({ profile: await profileService.saveProfile(req.user.id, req.body) });
}