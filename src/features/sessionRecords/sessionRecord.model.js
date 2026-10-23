import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sets: { type: Number, min: 1, max: 20 },
    reps: { type: Number, min: 1, max: 200 },
    durationMinutes: { type: Number, min: 1, max: 120 },
  },
  { _id: false }
);

const trainerEntrySchema = new mongoose.Schema(
  {
    exercises: { type: [exerciseSchema], default: [] },
    notes: { type: String, default: "", maxlength: 1000 },
    suggestedNextWorkout: { type: String, required: true, maxlength: 500 },
    submittedAt: { type: Date, required: true },
  },
  { _id: false }
);

const customerFeedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 500 },
    submittedAt: { type: Date, required: true },
  },
  { _id: false }
);

// One record per session. The trainer's half and the customer's half are written
// independently, so either can come first.
const sessionRecordSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    sessionDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 }, // worked out by the server from the timer
    trainerEntry: { type: trainerEntrySchema },
    customerFeedback: { type: customerFeedbackSchema },
  },
  { timestamps: true }
);

sessionRecordSchema.index({ customer: 1, sessionDate: -1 });
sessionRecordSchema.index({ trainer: 1, sessionDate: -1 });

export const SessionRecord = mongoose.model("SessionRecord", sessionRecordSchema);