import mongoose from "mongoose";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_MODE_VALUES,
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
} from "./booking.constants.js";

const priceSchema = new mongoose.Schema(
  {
    currency: String,
    slotType: String,
    isPeak: Boolean,
    peakWindow: { type: String, default: null },
    base: Number,
    commissionPercent: Number,
    commission: Number,
    total: Number,
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    strategy: { type: String, enum: ["preferred_trainer", "nearest_available"], required: true },
    preferredTrainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", default: null },
    preferredHonoured: { type: Boolean, default: false },
    eligibleCount: Number,
    distanceKm: Number,
    dailyLoad: Number,
    tieBreaker: { type: String, default: null },
    summary: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    mode: { type: String, enum: BOOKING_MODE_VALUES, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUS_VALUES, default: BOOKING_STATUS.CONFIRMED },
    price: { type: priceSchema, required: true }, // snapshot, later config changes don't affect it
    assignment: { type: assignmentSchema, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ trainer: 1, status: 1, startTime: 1 });
bookingSchema.index({ customer: 1, status: 1, startTime: 1 });

bookingSchema.statics.findActiveForTrainers = function (trainerIds, from, to, session = null) {
  return this.find({
    trainer: { $in: trainerIds },
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: to },
    endTime: { $gt: from },
  })
    .select("trainer startTime endTime")
    .session(session)
    .lean();
};

export const Booking = mongoose.model("Booking", bookingSchema);