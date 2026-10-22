import mongoose from "mongoose";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_MODE_VALUES,
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
} from "./booking.constants.js";
import { PAYMENT_METHOD_VALUES } from "../payments/payment.constants.js";

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
    strategy: {
      type: String,
      enum: ["preferred_trainer", "nearest_available", "kept_current_trainer"],
      required: true,
    },
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

const paymentInfoSchema = new mongoose.Schema(
  {
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    amountPaid: { type: Number, required: true, min: 0 }, // paise
    status: { type: String, enum: ["paid", "refunded", "not_refunded"], default: "paid" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", default: null },
  },
  { _id: false }
);

const cancellationSchema = new mongoose.Schema(
  {
    cancelledAt: { type: Date, required: true },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, default: null },
    refundable: { type: Boolean, required: true },
    outcome: { type: String, enum: ["session_restored", "amount_refunded", "no_refund"], required: true },
  },
  { _id: false }
);

const rescheduleSchema = new mongoose.Schema(
  {
    previousStartTime: { type: Date, required: true },
    previousEndTime: { type: Date, required: true },
    previousTrainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    rescheduledAt: { type: Date, required: true },
  },
  { _id: false }
);

const timerSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    warningAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    warningSentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }, // when the end was processed. endsAt is the authoritative end
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
    payment: { type: paymentInfoSchema, required: true },
    cancellation: { type: cancellationSchema, default: null },
    rescheduleHistory: { type: [rescheduleSchema], default: [] },
    timer: { type: timerSchema, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ trainer: 1, status: 1, startTime: 1 });
bookingSchema.index({ customer: 1, status: 1, startTime: 1 });
bookingSchema.index({ status: 1, "timer.endsAt": 1 });

bookingSchema.statics.findActiveForTrainers = function (
  trainerIds,
  from,
  to,
  session = null,
  excludeBookingId = null
) {
  return this.find({
    trainer: { $in: trainerIds },
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: to },
    endTime: { $gt: from },
    ...(excludeBookingId && { _id: { $ne: excludeBookingId } }),
  })
    .select("trainer startTime endTime")
    .session(session)
    .lean();
};

export const Booking = mongoose.model("Booking", bookingSchema);