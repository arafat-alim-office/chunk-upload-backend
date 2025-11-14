import { ChunkService } from "../services/chunk.service.js";
import SupabaseService from "../services/supabase.service.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

export class UploadController {
  // 1️⃣ Initiate a session → returns sessionId & chunkSize
  static async init(req, res, next) {
    try {
      const { fileName, fileSize, mimeType } = req.body;
      if (!fileName || !fileSize || !mimeType) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const sessionId = uuidv4();
      const sessionPath = path.join(process.env.UPLOAD_TMP_DIR, sessionId);

      // Ensure folder exists
      await fs.mkdir(sessionPath, { recursive: true });

      // Store meta (can be persisted in DB if you need)
      await ChunkService.saveMetadata(sessionId, {
        fileName,
        fileSize,
        mimeType,
        totalChunks: Math.ceil(fileSize / Number(process.env.CHUNK_SIZE)),
        createdAt: new Date(),
      });

      return res.json({
        sessionId,
        chunkSize: Number(process.env.CHUNK_SIZE),
      });
    } catch (err) {
      next(err);
    }
  }

  // 2️⃣ Receive a chunk
  static async receiveChunk(req, res, next) {
    try {
      const { sessionId } = req.params;
      const chunkIndex = Number(req.headers["x-chunk-index"]);
      if (isNaN(chunkIndex)) {
        return res
          .status(400)
          .json({ message: "Missing X-Chunk-Index header" });
      }

      // multer will have stored the file on disk for us
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Chunk missing" });
      }

      const destPath = path.join(
        process.env.UPLOAD_TMP_DIR,
        sessionId,
        `${chunkIndex}.chunk`
      );

      // Move multer temp file to our final location
      await fs.rename(file.path, destPath);

      // If you wish, you can persist the uploaded chunk index to DB
      await ChunkService.markChunkUploaded(sessionId, chunkIndex);

      return res.json({ received: true, chunkIndex });
    } catch (err) {
      next(err);
    }
  }

  // 3️⃣ Complete → merge and push to Supabase
  static async complete(req, res, next) {
    try {
      const { sessionId } = req.params;
      const meta = await ChunkService.getMetadata(sessionId);
      if (!meta) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Ensure all chunks are present
      const missing = await ChunkService.checkMissingChunks(sessionId);
      if (missing.length) {
        return res.status(400).json({ message: "Missing chunks", missing });
      }

      const finalPath = path.join(
        process.env.UPLOAD_TMP_DIR,
        `${sessionId}_merged`
      );

      // Merge
      await ChunkService.mergeChunks(sessionId, finalPath);

      // Upload to Supabase storage
      const supa = SupabaseService.getClient();
      const fileBuffer = await fs.readFile(finalPath);
      const { error } = await supa.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(`${meta.fileName}`, fileBuffer, {
          contentType: meta.mimeType,
        });

      if (error) throw error;

      // Store metadata in the "Chunk-Upload" table
      const { error: dbError } = await supa.from("Chunk-Upload").insert({
        id: sessionId,
        file_name: meta.fileName,
        mime_type: meta.mimeType,
        size_bytes: meta.fileSize,
        uploaded_at: new Date(),
        supabase_path: `${meta.fileName}`,
        status: "completed",
      });

      if (dbError) throw dbError;

      // Cleanup temp files (both chunks and merged file)
      await ChunkService.cleanup(sessionId);

      return res.json({
        success: true,
        url: supa.storage
          .from(process.env.SUPABASE_BUCKET)
          .getPublicUrl(`${meta.fileName}`).publicURL,
      });
    } catch (err) {
      next(err);
    }
  }

  // 4️⃣ Cancel → delete temporary data
  static async cancel(req, res, next) {
    try {
      const { sessionId } = req.params;
      await ChunkService.cleanup(sessionId);
      return res.json({ canceled: true });
    } catch (err) {
      next(err);
    }
  }
}
