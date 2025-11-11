const crypto = require("crypto");
const path = require("path");
const { AppError } = require("../utils/error.utils");
const { TEMP_DIR } = require("..");
const fs = require("fs").promises;

const db = {
  query: async (query, params) => {
    console.log("DB Query: ", query, params);
    // Add your supabase client
    return { rows: [], rowCount: 0 };
  },
};

//! configurations
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 1 * 1024 * 1024; // 1MB default
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 15 * 1024 * 1024;

function calculateChecksum(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function initializeUpload({
  fileName,
  orginalName,
  fileSize,
  mimeType,
  checksum,
}) {
  try {
    //! validate file size
    if (fileSize > MAX_FILE_SIZE) {
      throw new AppError("File size exceeds maximum allowed size", 413);
    }
    //! calculate total chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    //! Generate upload ID (in real implementation, store in database)
    const uploadId = crypto.randomUUID();
    console.log("upload_Id", uploadId);

    //! Create session directory
    const sessionDir = path.join(TEMP_DIR, uploadId);
    await fs.mkdir(sessionDir, { recursive: true }); // session directory created

    //! Insert into database
    console.log(
      `Initialized upload session: ${uploadId} for file: ${fileName}`
    );

    return {
      uploadId,
      chunkSize: CHUNK_SIZE,
      totalChunks,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to initialize upload", 500);
  }
}

async function uploadChunk({
  uploadId,
  chunkIndex,
  totalChunks,
  chunkBuffer,
  chunkSize,
}) {
  try {
    //! validate upload session exists, check in the database
    const sessionDir = path.join(TEMP_DIR, uploadId);
    try {
      await fs.access(sessionDir);
    } catch (error) {
      throw new AppError("Upload session not found", 404);
    }

    //! validate chunk size (last chunk can be smaller)
    const isLastChunk = chunkIndex === totalChunks - 1;
    const maxChunkSize = isLastChunk ? CHUNK_SIZE : CHUNK_SIZE;

    if (chunkSize > maxChunkSize) {
      throw new AppError("Chunk size exceeds limit", 400);
    }

    //! save chunk to file system
    const chunkFileName = `${chunkIndex}`;
    const chunkFilePath = path.join(sessionDir, chunkFileName);
    await fs.writeFile(chunkFilePath, chunkBuffer);

    //! calculate checksum
    const chunkChecksum = calculateChecksum(chunkBuffer);

    //! Insert into upload_chunks table
    console.log(`Uploaded chunk ${chunkIndex} for session ${uploadId}`);

    return {
      success: true,
      chunkIndex,
      checksum: chunkChecksum,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to upload chunk", 500);
  }
}

async function getUploadsStatus(uploadId) {
  try {
    //! validate upload session exists in DB
    const sessionDir = path.join(TEMP_DIR, uploadId);
    try {
      await fs.access(sessionDir);
    } catch (error) {
      throw new AppError("Upload session not found", 404);
    }

    //! get uploaded chunks from database
    const chunks = await fs.readdir(sessionDir);
    const uploadedChunks = chunks.map(
      chunk
        .map((chunk) => parseInt(chunk))
        .filter((chunk) => !isNaN(chunk))
        .sort((a, b) => a - b)
    );

    //! get session details from database
    const totalChunks =
      uploadedChunks.length > 0 ? Math.max(...uploadedChunks) + 1 : 0;

    return {
      uploadId,
    };
  } catch (error) {}
}

module.exports = {
  initializeUpload,
  uploadChunk,
  getUploadsStatus,
};
