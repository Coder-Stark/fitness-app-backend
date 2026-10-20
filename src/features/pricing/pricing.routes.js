import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { quoteSchema } from "./pricing.validation.js";
import { getQuote } from "./pricing.controller.js";

const router = Router();

router.post("/quote", requireAuth, validate(quoteSchema), getQuote);

export default router;