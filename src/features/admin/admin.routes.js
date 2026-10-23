import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { listAdminBookingsSchema } from "./admin.validation.js";
import { bookings, summary } from "./admin.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/summary", summary);
router.get("/bookings", validate(listAdminBookingsSchema, "query"), bookings);

export default router;