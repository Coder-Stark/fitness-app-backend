import { AppError } from "../../shared/utils/AppError.js";
import { pricingConfig } from "./pricing.config.js";

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const BPS_DIVISOR = 10000;

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type) => parts.find((part) => part.type === type).value;

  return {
    day: WEEKDAY_INDEX[read("weekday")],
    minutes: Number(read("hour")) * 60 + Number(read("minute")),
  };
}

export function findPeakWindow(slotStart, config = pricingConfig) {
  const { day, minutes } = getLocalTime(slotStart, config.timezone);

  return (
    config.peakWindows.find(
      (window) =>
        window.days.includes(day) &&
        minutes >= toMinutes(window.start) &&
        minutes < toMinutes(window.end)
    ) ?? null
  );
}

export function calculatePrice(slotStart, config = pricingConfig) {
  if (!(slotStart instanceof Date) || Number.isNaN(slotStart.getTime())) {
    throw new AppError("Invalid slot start time", 400);
  }

  const peakWindow = findPeakWindow(slotStart, config);
  const isPeak = peakWindow !== null;

  const base = isPeak ? config.peakPrice : config.normalPrice;
  const commission = Math.round((base * config.societyCommissionBps) / BPS_DIVISOR);

  return {
    currency: config.currency,
    slotType: isPeak ? "peak" : "normal",
    isPeak,
    peakWindow: isPeak ? `${peakWindow.start}-${peakWindow.end}` : null,
    base,
    commissionPercent: config.societyCommissionBps / 100,
    commission,
    total: base + commission,
  };
}