import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { requireIdempotencyKey } from "../../shared/middlewares/idempotency.middleware.js";
import { ROLES } from "../users/user.constants.js";
import {
  bookingIdParamSchema,
  cancelBookingSchema,
  createBookingSchema,
} from "./booking.validation.js";
import { create, mine, assigned, cancel } from "./booking.controller.js";

const router = Router();

router.use(requireAuth);

router.post( "/", requireRole(ROLES.CUSTOMER), requireIdempotencyKey, validate(createBookingSchema), create);
router.get("/mine", requireRole(ROLES.CUSTOMER), mine);
router.get("/assigned", requireRole(ROLES.TRAINER), assigned);
router.post( "/:id/cancel", requireRole(ROLES.CUSTOMER), validate(bookingIdParamSchema, "params"), validate(cancelBookingSchema), cancel);

export default router;