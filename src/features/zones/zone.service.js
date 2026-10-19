import { Zone } from "./zone.model.js";

export function listZones() {
  return Zone.find({ isActive: true }).sort("name");
}

export function findZoneById(id) {
  return Zone.findById(id);
}