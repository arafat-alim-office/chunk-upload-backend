import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRouter from "./routes/upload.route.js";
import { errorHandler } from "./middlewares/error.handler.js";

import "../cron/cleanup.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/upload", uploadRouter);

// health check route

const PORT = process.env.PORT || 8080;
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: `Chunk upload backend server v2 running at http://localhost:${PORT}`,
  });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
