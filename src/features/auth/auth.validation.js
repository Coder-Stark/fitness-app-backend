import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  zoneId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid zone id"),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});