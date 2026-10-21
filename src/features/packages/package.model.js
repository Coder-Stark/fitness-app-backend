import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planCode: { type: String, required: true },
    planName: { type: String, required: true },
    sessionsTotal: { type: Number, required: true, min: 1 },
    sessionsUsed: { type: Number, default: 0, min: 0 },
    pricePaid: { type: Number, required: true, min: 0 }, // paise
  },
  { timestamps: true }
);

packageSchema.index({ customer: 1, createdAt: 1 });

export const Package = mongoose.model("Package", packageSchema);