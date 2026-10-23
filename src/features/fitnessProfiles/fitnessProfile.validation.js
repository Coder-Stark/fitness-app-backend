import { z } from "zod";
import {
  EQUIPMENT_OPTIONS,
  FITNESS_GOALS,
  FITNESS_LEVELS,
  INTENSITIES,
  WORKOUT_TYPES,
} from "./fitnessProfile.constants.js";

const hasNoRepeats = (items) => new Set(items).size === items.length;

export const saveProfileSchema = z.object({
  age: z
    .number()
    .int()
    .min(16, "Age must be between 16 and 90")
    .max(90, "Age must be between 16 and 90"),
  weightKg: z
    .number()
    .min(30, "Weight must be between 30 and 300 kg")
    .max(300, "Weight must be between 30 and 300 kg")
    .transform((value) => Math.round(value * 10) / 10),
  goals: z
    .array(z.enum(FITNESS_GOALS))
    .min(1, "Choose 1 to 3 goals")
    .max(3, "Choose 1 to 3 goals")
    .refine(hasNoRepeats, "Goals must not repeat"),
  level: z.enum(FITNESS_LEVELS),
  preferences: z.object({
    workoutTypes: z
      .array(z.enum(WORKOUT_TYPES))
      .min(1, "Choose 1 to 4 workout types")
      .max(4, "Choose 1 to 4 workout types")
      .refine(hasNoRepeats, "Workout types must not repeat"),
    intensity: z.enum(INTENSITIES),
    equipment: z.enum(EQUIPMENT_OPTIONS),
    healthNotes: z.string().trim().max(300, "Health notes must be 300 characters or fewer").default(""),
  }),
});