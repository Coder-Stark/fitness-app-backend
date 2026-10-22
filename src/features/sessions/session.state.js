import { addMinutes } from "../../shared/utils/time.js";
import { BOOKING_STATUS } from "../bookings/booking.constants.js";
import { sessionConfig } from "./session.config.js";

export const SESSION_PHASES = Object.freeze({
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  ENDING_SOON: "ending_soon",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

// The phase is worked out from the saved timestamps and the current time, so it stays
// correct even if the background worker is late or the server restarted.
export function getSessionPhase(booking, now = new Date()) {
  if (booking.status === BOOKING_STATUS.CANCELLED) return SESSION_PHASES.CANCELLED;
  if (booking.status === BOOKING_STATUS.COMPLETED) return SESSION_PHASES.COMPLETED;

  if (booking.status === BOOKING_STATUS.IN_PROGRESS && booking.timer) {
    if (now >= booking.timer.endsAt) return SESSION_PHASES.COMPLETED;
    if (now >= booking.timer.warningAt) return SESSION_PHASES.ENDING_SOON;
    return SESSION_PHASES.IN_PROGRESS;
  }

  return SESSION_PHASES.SCHEDULED;
}

export function getStartWindow(booking) {
  return {
    opensAt: addMinutes(booking.startTime, -sessionConfig.startWindowBeforeMinutes),
    closesAt: addMinutes(booking.startTime, sessionConfig.startWindowAfterMinutes),
  };
}

export function describeSession(booking, now = new Date()) {
  const phase = getSessionPhase(booking, now);
  const timer = booking.timer ?? null;
  const running = phase === SESSION_PHASES.IN_PROGRESS || phase === SESSION_PHASES.ENDING_SOON;
  const startWindow = getStartWindow(booking);

  return {
    phase,
    scheduledStart: booking.startTime,
    scheduledEnd: booking.endTime,
    startedAt: timer?.startedAt ?? null,
    warningAt: timer?.warningAt ?? null,
    endsAt: timer?.endsAt ?? null,
    completedAt: timer?.completedAt ?? null,
    warningSent: Boolean(timer?.warningSentAt),
    durationSeconds: sessionConfig.durationMinutes * 60,
    remainingSeconds: running ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : null,
    startWindow,
    canStart:
      phase === SESSION_PHASES.SCHEDULED &&
      now >= startWindow.opensAt &&
      now <= startWindow.closesAt,
  };
}