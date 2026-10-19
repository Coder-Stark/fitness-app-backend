import express from "express";
import cors from "cors";
import { env } from "../shared/config/env.js";
import { notFound, errorHandler } from "../shared/middlewares/error.middleware.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
// app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Phase 1+: mount feature routes here, e.g. app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;