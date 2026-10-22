import { bookingConfig } from "../bookings/booking.config.js";

export const sessionConfig = Object.freeze({
  durationMinutes: bookingConfig.sessionMinutes, // one source of truth for the session length
  // warningAfterMinutes: 55,            //shrink for testing only
  warningAfterMinutes: 2,
  startWindowBeforeMinutes: 20, // trainer may start up to this long before the booked time
  startWindowAfterMinutes: 30, // ...and up to this long after it
  workerIntervalMs: 5000,
});

if (sessionConfig.warningAfterMinutes >= sessionConfig.durationMinutes) {
  throw new Error("sessionConfig.warningAfterMinutes must be smaller than the session duration");
}