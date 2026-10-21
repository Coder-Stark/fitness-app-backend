import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/jwt.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { listNotificationsSchema, notificationIdParamSchema } from "./notification.validation.js";
import { list, unreadCount, readOne, readAll } from "./notification.controller.js";

const router = Router();

// Any logged-in role can read their own notifications
router.use(requireAuth);

router.get("/", validate(listNotificationsSchema, "query"), list);
router.get("/unread-count", unreadCount);
router.post("/read-all", readAll);
router.patch("/:id/read", validate(notificationIdParamSchema, "params"), readOne);

export default router;