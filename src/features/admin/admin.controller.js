import * as adminService from "./admin.service.js";

export async function summary(req, res) {
  res.json(await adminService.getSummary());
}

export async function bookings(req, res) {
  res.json(await adminService.listBookings(req.validated.query));
}