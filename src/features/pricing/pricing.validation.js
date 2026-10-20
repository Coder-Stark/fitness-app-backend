import { z } from "zod";

export const quoteSchema = z.object({
  slotStart: z.iso.datetime({
    offset: true,
    error: "slotStart must be an ISO 8601 date-time, e.g. 2026-10-20T06:30:00Z",
  }),
});