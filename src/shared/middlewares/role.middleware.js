import { AppError } from "../utils/AppError.js";

export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this", 403));
    }
    next();
  };