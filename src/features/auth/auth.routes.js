import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { register, login, me } from "./auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;