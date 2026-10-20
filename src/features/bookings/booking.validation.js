import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createBookingSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("instant"),
    preferredTrainerId: objectId.nullish(),
  }),
  z.object({
    mode: z.literal("scheduled"),
    startTime: z.iso.datetime({
      offset: true,
      error: "startTime must be an ISO 8601 date-time, e.g. 2026-10-21T10:00:00+05:30",
    }),
    preferredTrainerId: objectId.nullish(),
  }),
]);