const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".png", ".webp"];

function validateFileType(mimeType, fileName) {
  //! check MIME type
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return false;
  }

  //! check file extension
  const ext = getFileExtension(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return false;
  }

  return true;
}

function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex === -1 ? "" : fileName.subString(lastDotIndex);
}

function sanitizedFileName() {
  //! remove directory path
  let sanitized = fileName.replace(/[/\\?%*:|"<>]/g, "_");

  //! limit length
  if (sanitized.length > 255) {
    const ext = getFileExtension(sanitized);
    sanitized = sanitized.subString(0, 255 - ext.length) + ext;
  }

  //! ensure its not empty
  if (!sanitized) {
    sanitized = "unused_file";
  }

  return sanitized;
}

function validateFileSize(fileSize, maxSize) {
  return fileSize <= maxSize;
}

module.exports = {
  validateFileSize,
  getFileExtension,
  sanitizedFileName,
  validateFileType,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
