import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { requireRole } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { bookingIdParamSchema } from "../bookings/booking.validation.js";
import { ROLES } from "../users/user.constants.js";
import { feedbackSchema, trainerNotesSchema } from "./sessionRecord.validation.js";
import { assigned, feedback, getOne, mine, trainerNotes } from "./sessionRecord.controller.js";

const router = Router();

router.use(requireAuth);

// The fixed paths come first, so "mine" and "assigned" are not read as a booking id
router.get("/mine", requireRole(ROLES.CUSTOMER), mine);
router.get("/assigned", requireRole(ROLES.TRAINER), assigned);

router.get("/:id", requireRole(ROLES.CUSTOMER, ROLES.TRAINER), validate(bookingIdParamSchema, "params"), getOne);
router.put("/:id/trainer-notes", requireRole(ROLES.TRAINER), validate(bookingIdParamSchema, "params"), validate(trainerNotesSchema), trainerNotes );
router.put("/:id/feedback", requireRole(ROLES.CUSTOMER), validate(bookingIdParamSchema, "params"), validate(feedbackSchema), feedback );

export default router;