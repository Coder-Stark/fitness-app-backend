import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    message: statusCode === 500 ? "Internal server error" : err.message,
    ...(err.details && { details: err.details }),
  });
}