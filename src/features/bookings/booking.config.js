export const bookingConfig = Object.freeze({
  sessionMinutes: 60,
  slotStepMinutes: 60, // scheduled slots start on this grid (must divide 1440)
  instantLeadMinutes: 15, // trainer travel buffer for instant bookings
  instantRoundMinutes: 5,
  scheduledMinLeadMinutes: 60, // anything sooner is an instant booking
  maxAdvanceDays: 7,
  alternativeSlotsLimit: 5,
});