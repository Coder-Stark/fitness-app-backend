import mongoose from "mongoose";
import { locationSchema } from "../../shared/models/location.schema.js";

const trainerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    location: { type: locationSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

trainerSchema.index({ zone: 1, isActive: 1 });

export const Trainer = mongoose.model("Trainer", trainerSchema);