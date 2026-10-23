import mongoose from "mongoose";
import {
  EQUIPMENT_OPTIONS,
  FITNESS_GOALS,
  FITNESS_LEVELS,
  INTENSITIES,
  WORKOUT_TYPES,
} from "./fitnessProfile.constants.js";

const fitnessProfileSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    age: { type: Number, required: true, min: 16, max: 90 },
    weightKg: { type: Number, required: true, min: 30, max: 300 },
    goals: [{ type: String, enum: FITNESS_GOALS }],
    level: { type: String, enum: FITNESS_LEVELS, required: true },
    preferences: {
      workoutTypes: [{ type: String, enum: WORKOUT_TYPES }],
      intensity: { type: String, enum: INTENSITIES, required: true },
      equipment: { type: String, enum: EQUIPMENT_OPTIONS, required: true },
      healthNotes: { type: String, default: "", maxlength: 300 },
    },
  },
  { timestamps: true }
);

export const FitnessProfile = mongoose.model("FitnessProfile", fitnessProfileSchema);