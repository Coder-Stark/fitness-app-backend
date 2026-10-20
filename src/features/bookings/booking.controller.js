import * as bookingService from "./booking.service.js";

export async function create(req, res) {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ booking });
}

export async function mine(req, res) {
  const bookings = await bookingService.listMyBookings(req.user.id);
  res.json({ bookings });
}

export async function assigned(req, res) {
  const bookings = await bookingService.listAssignedBookings(req.user.id);
  res.json({ bookings });
}