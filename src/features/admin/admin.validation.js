import { z } from "zod";
import { SESSION_PHASES } from "../sessions/session.state.js";

export const listAdminBookingsSchema = z
  .object({
    phase: z.enum(Object.values(SESSION_PHASES)).optional(),
    from: z.iso.date("Use YYYY-MM-DD").optional(),
    to: z.iso.date("Use YYYY-MM-DD").optional(),
    trainerId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, "Invalid id")
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "from must not be after to",
    path: ["to"],
  });