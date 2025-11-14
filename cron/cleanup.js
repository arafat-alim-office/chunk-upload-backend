import cron from "node-cron";
import path from "path";
import fs from "fs/promises";
import { ChunkService } from "../src/services/chunk.service.js";

const TMP_DIR = process.env.UPLOAD_TMP_DIR;

// Run every night at 02:00
cron.schedule("0 2 * * *", async () => {
  console.log("🧹 Running stale upload cleanup");
  const sessions = await fs.readdir(TMP_DIR);
  const now = Date.now();

  for (const sessionId of sessions) {
    const sessionPath = path.join(TMP_DIR, sessionId);
    const stats = await fs.stat(sessionPath);
    // Delete if older than 24 h OR if folder is empty
    if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
      await ChunkService.cleanup(sessionId);
      console.log(`🗑️ Deleted stale session ${sessionId}`);
    }
  }
});

// Cron job setup complete
