import { z } from "zod";

export const slotsQuerySchema = z.object({
  date: z.iso.date("date must be in YYYY-MM-DD format"),
});