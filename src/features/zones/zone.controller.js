import * as zoneService from "./zone.service.js";

export async function getZones(req, res) {
  const zones = await zoneService.listZones();
  res.json({ zones });
}