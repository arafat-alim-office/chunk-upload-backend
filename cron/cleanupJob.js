#!/usr/bin/env node

// This script runs the cleanup job as a standalone process
import path from "path";
import fs from "fs/promises";
import { ChunkService } from "../src/services/chunk.service.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const TMP_DIR = process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), "tmp");

async function runCleanup() {
  console.log("🧹 Running stale upload cleanup");
  try {
    const sessions = await fs.readdir(TMP_DIR);
    const now = Date.now();

    for (const sessionId of sessions) {
      const sessionPath = path.join(TMP_DIR, sessionId);
      try {
        const stats = await fs.stat(sessionPath);
        // Delete if older than 24h OR if folder is empty
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await ChunkService.cleanup(sessionId);
          console.log(`🗑️ Deleted stale session ${sessionId}`);
        }
      } catch (err) {
        console.error(`Error processing session ${sessionId}:`, err.message);
      }
    }
    console.log("✅ Cleanup completed");
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  }
}

// Run immediately and exit
runCleanup().then(() => {
  process.exit(0);
});