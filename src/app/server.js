import app from "./app.js";
import { env } from "../shared/config/env.js";
import { connectDB } from "../shared/config/db.js";
import { startSessionWorker } from "../features/sessions/session.worker.js";

async function start() {
  try {
    await connectDB();
    startSessionWorker();
    app.listen(env.PORT, () => {
      console.log(`Server running on PORT: ${env.PORT}`);
      // console.log("CLIENT_URL =", JSON.stringify(env.CLIENT_URL));
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();