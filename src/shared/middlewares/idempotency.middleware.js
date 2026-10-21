import { AppError } from "../utils/AppError.js";

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

export function requireIdempotencyKey(req, res, next) {
  const key = req.get("Idempotency-Key");

  if (!key) return next(new AppError("Idempotency-Key header is required", 400));
  if (!KEY_PATTERN.test(key)) {
    return next(
      new AppError("Idempotency-Key must be 8-100 characters: letters, numbers, - or _", 400)
    );
  }

  req.idempotencyKey = key;
  next();
}