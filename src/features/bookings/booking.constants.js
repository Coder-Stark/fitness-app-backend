export const BOOKING_MODES = Object.freeze({
  INSTANT: "instant",
  SCHEDULED: "scheduled",
});

export const BOOKING_MODE_VALUES = Object.values(BOOKING_MODES);

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

// Statuses that occupy a trainer's and a customer's time
export const ACTIVE_BOOKING_STATUSES = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS];