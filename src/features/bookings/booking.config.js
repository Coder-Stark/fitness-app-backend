export const bookingConfig = Object.freeze({
  // sessionMinutes: 60,         //shrink for testing only
  sessionMinutes: 4,
  slotStepMinutes: 60, // scheduled slots start on this grid (must divide 1440)
  instantLeadMinutes: 15, // trainer travel buffer for instant bookings
  instantRoundMinutes: 5,
  scheduledMinLeadMinutes: 60, // anything sooner is an instant booking
  maxAdvanceDays: 7,
  alternativeSlotsLimit: 5,
  freeCancellationMinutes: 120, // cancel at least this long before start to get a refund
  rescheduleNoticeMinutes: 120, // a session can be moved only this long before its start
  maxReschedules: 2,
});