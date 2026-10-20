import { AppError } from "./AppError.js";

// Writing to a document inside a transaction makes concurrent transactions that touch
// the same document conflict, so one of them is retried. This serialises bookings
// per customer and per trainer.
export async function lockDocument(Model, id, session) {
  const result = await Model.updateOne({ _id: id }, { $inc: { lockVersion: 1 } }, { session });
  if (result.matchedCount === 0) throw new AppError("Record not found", 404);
}