export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

// India has no daylight saving, so a fixed offset is exact.
const IST_OFFSET_MINUTES = 330;

export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * MINUTE_MS);

export function toLocal(date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * MINUTE_MS);
  return {
    dateKey: shifted.toISOString().slice(0, 10),
    day: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export const istDayStart = (dateKey) => new Date(`${dateKey}T00:00:00+05:30`);

export const istDayEnd = (dateKey) => new Date(istDayStart(dateKey).getTime() + DAY_MS);

export function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;