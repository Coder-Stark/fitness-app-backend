import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { updateAvailabilitySchema } from "./availability.validation.js";
import { getMine, updateMine } from "./availability.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.TRAINER));

router.get("/me", getMine);
router.put("/me", validate(updateAvailabilitySchema), updateMine);

export default router;