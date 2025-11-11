const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
require("dotenv").config();

//! ensure uplaods directory exists
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const TEMP_DIR = path.join(UPLOADS_DIR, "temp");
const FILES_DIR = path.join(UPLOADS_DIR, "files");

async function ensureDirectories() {
  try {
    await fs
      .access(UPLOADS_DIR)
      .catch(() => fs.mkdir(UPLOADS_DIR, { recursive: true }));
    await fs
      .access(TEMP_DIR)
      .catch(() => fs.mkdir(TEMP_DIR, { recursive: true }));
    await fs
      .access(FILES_DIR)
      .catch(() => fs.mkdir(FILES_DIR), { recursive: true });
    console.log("Upload directories ensured");
  } catch (error) {
    console.error("Error ensuring directories: ", error);
  }
}

ensureDirectories();

//! initalise Express app
const app = express();
const PORT = process.env.PORT || 4000;

//! middlewares
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

//! Routes
// const chunkUploadRoutes = require("./routes/chunk.routes");
// app.use("/api/chunk-upload", chunkUploadRoutes);

//! Health check endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Chunk upload service is running" });
});

//! Error handling middlewares
app.use((err, req, res, next) => {
  console.error("Unhandled error: ", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something Went Wrong!",
  });
});

//! 404 Not Found Handler (must be the last middleware)
app.use((req, res, next) => {
  res.status(404).json({
    error: "Sorry, couldn't find that page!",
  });
});

//! start server
app.listen(PORT, () => {
  console.log(`Chunk upload server running on port: ${PORT}`);
});

module.exports = app;
