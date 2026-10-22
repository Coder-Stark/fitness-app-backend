import { Router } from "express";
import { getServerTime } from "./time.controller.js";

const router = Router();

router.get("/", getServerTime);

export default router;