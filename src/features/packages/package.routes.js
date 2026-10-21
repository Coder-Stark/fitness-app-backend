import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { requireIdempotencyKey } from "../../shared/middlewares/idempotency.middleware.js";
import { ROLES } from "../users/user.constants.js";
import { purchaseSchema } from "./package.validation.js";
import { plans, mine, purchase } from "./package.controller.js";

const router = Router();

router.use(requireAuth, requireRole(ROLES.CUSTOMER));

router.get("/plans", plans);
router.get("/mine", mine);
router.post("/purchase", requireIdempotencyKey, validate(purchaseSchema), purchase);

export default router;