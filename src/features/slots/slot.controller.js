import * as slotService from "./slot.service.js";

export async function getSlots(req, res) {
  const result = await slotService.getSlotsForDate(req.user.id, req.validated.query.date);
  res.json(result);
}

export async function getInstantOffer(req, res) {
  const offer = await slotService.getInstantOffer(req.user.id);
  res.json(offer);
}