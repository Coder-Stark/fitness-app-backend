import mongoose from "mongoose";
import { locationSchema } from "../../shared/models/location.schema.js";

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    center: { type: locationSchema, required: true },
    radiusKm: { type: Number, default: 3, min: 0.1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Zone = mongoose.model("Zone", zoneSchema);