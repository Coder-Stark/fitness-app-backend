import * as recordService from "./sessionRecord.service.js";

export async function getOne(req, res) {
  res.json(await recordService.getSessionRecord(req.user, req.validated.params.id));
}

export async function mine(req, res) {
  res.json({ sessions: await recordService.listMine(req.user.id) });
}

export async function assigned(req, res) {
  res.json({ sessions: await recordService.listAssigned(req.user.id) });
}

export async function trainerNotes(req, res) {
  const record = await recordService.saveTrainerNotes(req.user, req.validated.params.id, req.body);
  res.json({ record });
}

export async function feedback(req, res) {
  const record = await recordService.saveFeedback(req.user, req.validated.params.id, req.body);
  res.json({ record });
}