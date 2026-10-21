import mongoose from "mongoose";
import { PAYMENT_KINDS, PAYMENT_METHOD_VALUES, PAYMENT_STATUS } from "./payment.constants.js";

const paymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: Object.values(PAYMENT_KINDS), required: true },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    amount: { type: Number, required: true, min: 0 }, // paise
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.SUCCEEDED,
    },
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },
    reference: { type: String, default: null }, // gateway reference
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", default: null },
    refundedAt: { type: Date, default: null },
    refundedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The final guard against duplicates: one key can only ever create one payment per customer
paymentSchema.index({ customer: 1, idempotencyKey: 1 }, { unique: true });

export const Payment = mongoose.model("Payment", paymentSchema);