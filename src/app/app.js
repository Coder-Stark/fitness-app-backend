import express from "express";
import cors from "cors";
import { env } from "../shared/config/env.js";
import { notFound, errorHandler } from "../shared/middlewares/error.middleware.js";
import authRoutes from "../features/auth/auth.routes.js";
import zoneRoutes from "../features/zones/zone.routes.js";
import pricingRoutes from "../features/pricing/pricing.routes.js";
import availabilityRoutes from "../features/availability/availability.routes.js";
import slotRoutes from "../features/slots/slot.routes.js";
import bookingRoutes from "../features/bookings/booking.routes.js";
import packageRoutes from "../features/packages/package.routes.js";
import notificationRoutes from "../features/notifications/notification.routes.js";
import sessionRoutes from "../features/sessions/session.routes.js";
import timeRoutes from "../features/time/time.routes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
// app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/time", timeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;