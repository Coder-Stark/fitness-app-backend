import * as sessionService from "./session.service.js";

export async function getOne(req, res) {
  res.json(await sessionService.getSessionForUser(req.user, req.validated.params.id));
}

export async function start(req, res) {
  res.json(await sessionService.startSession(req.user.id, req.validated.params.id));
}