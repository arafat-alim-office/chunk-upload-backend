import path from "path";
import fs from "fs/promises";
import { existsSync, createWriteStream, readdirSync, mkdirSync } from "fs";
import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

// ------------------------------------------------------------------
//  Configuration
// ------------------------------------------------------------------
const TMP_DIR = process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), "tmp");
mkdirSync(TMP_DIR, { recursive: true });

const metaFile = path.join(TMP_DIR, "meta.json");
const adapter = new JSONFileSync(metaFile);
const db = new LowSync(adapter, { uploads: [] });

db.read();
db.data ??= { uploads: [] };
db.write();

// ------------------------------------------------------------------
//  Service
// ------------------------------------------------------------------
export class ChunkService {
  static async saveMetadata(sessionId, meta) {
    db.data.uploads.push({ sessionId, ...meta, uploadedChunks: [] });
    db.write();
  }

  static async getMetadata(sessionId) {
    return db.data.uploads.find((u) => u.sessionId === sessionId);
  }

  static async markChunkUploaded(sessionId, index) {
    const upload = db.data.uploads.find((u) => u.sessionId === sessionId);
    if (!upload) return;
    const arr = upload.uploadedChunks ?? [];
    if (!arr.includes(index)) {
      arr.push(index);
      upload.uploadedChunks = arr;
      db.write();
    }
  }

  static async checkMissingChunks(sessionId) {
    const meta = await this.getMetadata(sessionId);
    if (!meta) return [];

    const folder = path.join(TMP_DIR, sessionId);
    const files = readdirSync(folder)
      .filter((f) => f.endsWith(".chunk"))
      .map((f) => Number(f.split(".chunk")[0]));

    const missing = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      if (!files.includes(i)) missing.push(i);
    }
    return missing;
  }

  static async mergeChunks(sessionId, destPath) {
    const folder = path.join(TMP_DIR, sessionId);
    const meta = await this.getMetadata(sessionId);
    if (!meta) throw new Error(`Missing metadata for ${sessionId}`);

    const writeStream = createWriteStream(destPath);
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkPath = path.join(folder, `${i}.chunk`);
      const data = await fs.readFile(chunkPath);
      writeStream.write(data);
    }
    writeStream.end();
    await new Promise((resolve) => writeStream.on("finish", resolve));
  }

  static async cleanup(sessionId) {
    const folder = path.join(TMP_DIR, sessionId);
    if (existsSync(folder)) {
      for (const f of readdirSync(folder)) {
        await fs.unlink(path.join(folder, f));
      }
      await fs.rmdir(folder);
    }

    const mergedPath = path.join(TMP_DIR, `${sessionId}_merged`);
    if (existsSync(mergedPath)) await fs.unlink(mergedPath);

    db.data.uploads = db.data.uploads.filter((u) => u.sessionId !== sessionId);
    db.write();
  }
}
