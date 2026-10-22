import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { bookingIdParamSchema } from "../bookings/booking.validation.js";
import { ROLES } from "../users/user.constants.js";
import { getOne, start } from "./session.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/:id", requireRole(ROLES.CUSTOMER, ROLES.TRAINER), validate(bookingIdParamSchema, "params"), getOne);
router.post("/:id/start", requireRole(ROLES.TRAINER), validate(bookingIdParamSchema, "params"), start);

export default router;