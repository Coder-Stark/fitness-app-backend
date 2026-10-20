import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm (24-hour)");

const interval = z
  .object({
    day: z.number().int().min(0).max(6),
    start: hhmm,
    end: hhmm,
  })
  .refine((value) => value.start < value.end, {
    message: "start must be before end",
    path: ["end"],
  });

export const updateAvailabilitySchema = z.object({
  weeklySchedule: z
    .array(interval)
    .max(42)
    .superRefine((items, ctx) => {
      const sorted = [...items].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].day === sorted[i - 1].day && sorted[i].start < sorted[i - 1].end) {
          ctx.addIssue({ code: "custom", message: "Time ranges on the same day must not overlap" });
          return;
        }
      }
    }),
});