import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { createBookingSchema } from "./booking.validation.js";
import { create, mine, assigned } from "./booking.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole(ROLES.CUSTOMER), validate(createBookingSchema), create);
router.get("/mine", requireRole(ROLES.CUSTOMER), mine);
router.get("/assigned", requireRole(ROLES.TRAINER), assigned);

export default router;