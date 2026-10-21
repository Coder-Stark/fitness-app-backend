import * as bookingService from "./booking.service.js";

export async function create(req, res) {
  const { booking, replayed } = await bookingService.createBooking(
    req.user.id,
    req.body,
    req.idempotencyKey
  );
  if (replayed) res.set("Idempotent-Replayed", "true");
  res.status(replayed ? 200 : 201).json({ booking, replayed });
}

export async function cancel(req, res) {
  const result = await bookingService.cancelBooking(
    req.user.id,
    req.validated.params.id,
    req.body?.reason
  );
  res.json(result);
}

export async function mine(req, res) {
  const bookings = await bookingService.listMyBookings(req.user.id);
  res.json({ bookings });
}

export async function assigned(req, res) {
  const bookings = await bookingService.listAssignedBookings(req.user.id);
  res.json({ bookings });
}