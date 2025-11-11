const express = require("express");
const multer = require("multer");
const {
  initializeUpload,
  uploadChunk,
  getUploadsStatus,
  finalizeUpload,
  cancelUpload,
} = require("../controllers/chunk.controller");

const router = express.Router();

//! configure multer

//! routes
//! Initialize a new chunked upload session
router.post("/init", initializeUpload);

//! Upload a single upload
router.post("/chunk", uploadChunk);

//! Get upload status and progress
router.post("/status", getUploadsStatus);

//! Finalize upload and assemble chunks
router.post("/finalize", finalizeUpload);

//! Cancel upload and clean up resources
router.delete("/cancel/:uploadId", cancelUpload);

module.exports = router;
