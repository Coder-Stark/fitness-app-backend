import { z } from "zod";

const exercise = z.object({
  name: z.string().trim().min(2, "Exercise name is too short").max(80, "Exercise name is too long"),
  sets: z.number().int().min(1, "Sets must be between 1 and 20").max(20, "Sets must be between 1 and 20").optional(),
  reps: z.number().int().min(1, "Reps must be between 1 and 200").max(200, "Reps must be between 1 and 200").optional(),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Exercise duration must be between 1 and 120 minutes")
    .max(120, "Exercise duration must be between 1 and 120 minutes")
    .optional(),
});

export const trainerNotesSchema = z.object({
  exercises: z
    .array(exercise)
    .min(1, "Add at least one exercise or activity")
    .max(20, "Add at most 20 exercises"),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").default(""),
  suggestedNextWorkout: z
    .string()
    .trim()
    .min(3, "Suggest what the next workout should be")
    .max(500, "Suggested workout must be 500 characters or fewer"),
});

export const feedbackSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().max(500, "Comment must be 500 characters or fewer").default(""),
});