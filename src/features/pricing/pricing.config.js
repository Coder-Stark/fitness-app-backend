const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday ... 6 = Saturday

export const pricingConfig = Object.freeze({
  currency: "INR",
  timezone: "Asia/Kolkata",

  // All amounts in paise (1 rupee = 100 paise)
  normalPrice: 39900,
  peakPrice: 49900,

  // Basis points: 1000 = 10.00%
  societyCommissionBps: 1000,

  // A slot is peak if its start time falls in [start, end) on one of the listed days
  peakWindows: [
    { days: ALL_DAYS, start: "06:00", end: "09:00" },
    { days: ALL_DAYS, start: "18:00", end: "21:00" },
  ],
});