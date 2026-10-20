import mongoose from "mongoose";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const intervalSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    start: { type: String, required: true, match: HHMM },
    end: { type: String, required: true, match: HHMM },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true, unique: true },
    weeklySchedule: { type: [intervalSchema], default: [] },
  },
  { timestamps: true }
);

export const Availability = mongoose.model("Availability", availabilitySchema);