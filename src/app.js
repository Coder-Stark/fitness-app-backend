import express from "express";
import cors from "cors";


const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);


app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running"
  })
});

export default app;