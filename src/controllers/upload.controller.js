import { ChunkService } from "../services/chunk.service.js";
import SupabaseService from "../services/supabase.service.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

export class UploadController {
  static async init(req, res, next) {
    try {
      const { fileName, fileSize, mimeType } = req.body;
      if (!fileName || !fileSize || !mimeType) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const sessionId = uuidv4();
      const sessionPath = path.join(process.env.UPLOAD_TMP_DIR, sessionId);

      await fs.mkdir(sessionPath, { recursive: true });

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

  static async receiveChunk(req, res, next) {
    try {
      const { sessionId } = req.params;
      const chunkIndex = Number(req.headers["x-chunk-index"]);
      if (isNaN(chunkIndex)) {
        return res
          .status(400)
          .json({ message: "Missing X-Chunk-Index header" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Chunk missing" });
      }

      const destPath = path.join(
        process.env.UPLOAD_TMP_DIR,
        sessionId,
        `${chunkIndex}.chunk`
      );

      await fs.rename(file.path, destPath);

      await ChunkService.markChunkUploaded(sessionId, chunkIndex);

      return res.json({ received: true, chunkIndex });
    } catch (err) {
      next(err);
    }
  }

  static async complete(req, res, next) {
    try {
      const { sessionId } = req.params;
      const meta = await ChunkService.getMetadata(sessionId);
      if (!meta) {
        return res.status(404).json({ message: "Session not found" });
      }

      const missing = await ChunkService.checkMissingChunks(sessionId);
      if (missing.length) {
        return res.status(400).json({ message: "Missing chunks", missing });
      }

      const finalPath = path.join(
        process.env.UPLOAD_TMP_DIR,
        `${sessionId}_merged`
      );

      await ChunkService.mergeChunks(sessionId, finalPath);

      const supa = SupabaseService.getClient();
      const fileBuffer = await fs.readFile(finalPath);
      const { error } = await supa.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(`${meta.fileName}`, fileBuffer, {
          contentType: meta.mimeType,
        });

      if (error) throw error;

      const { error: dbError } = await supa.from("uploads").insert({
        id: sessionId,
        file_name: meta.fileName,
        mime_type: meta.mimeType,
        size_bytes: meta.fileSize,
        uploaded_at: new Date(),
        supabase_path: `${meta.fileName}`,
        status: "completed",
      });

      if (dbError) throw dbError;

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
