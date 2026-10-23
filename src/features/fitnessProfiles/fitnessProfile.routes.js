import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { saveProfileSchema } from "./fitnessProfile.validation.js";
import { getMine, saveMine } from "./fitnessProfile.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.CUSTOMER));

router.get("/me", getMine);
router.put("/me", validate(saveProfileSchema), saveMine);

export default router;