import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { slotsQuerySchema } from "./slot.validation.js";
import { getSlots, getInstantOffer } from "./slot.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.CUSTOMER));

router.get("/instant", getInstantOffer);
router.get("/", validate(slotsQuerySchema, "query"), getSlots);

export default router;