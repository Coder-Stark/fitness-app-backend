import { z } from "zod";
import { PAYMENT_METHOD_VALUES } from "../payments/payment.constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// sandboxOutcome only exists because the payment gateway is simulated
const paymentFields = {
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  sandboxOutcome: z.enum(["success", "decline"]).optional(),
};

export const createBookingSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("instant"),
    preferredTrainerId: objectId.nullish(),
    ...paymentFields,
  }),
  z.object({
    mode: z.literal("scheduled"),
    startTime: z.iso.datetime({
      offset: true,
      error: "startTime must be an ISO 8601 date-time, e.g. 2026-10-21T10:00:00+05:30",
    }),
    preferredTrainerId: objectId.nullish(),
    ...paymentFields,
  }),
]);

export const bookingIdParamSchema = z.object({ id: objectId });

export const cancelBookingSchema = z
  .object({ reason: z.string().trim().max(200).optional() })
  .optional();