import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { getMine } from "./recommendation.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.CUSTOMER));

router.get("/me", getMine);

export default router;