async function initializeUpload(req, res, next) {
  try {
    const { fileName, fileSize, mimeType, checksum } = req.body;

    //! validate inputs -- using custom
    if (!fileName || !fileSize) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["fileName", "fileSize"],
      });
    }

    //! validate file type == using custom
    if (mimeType && !validateFileType(mimeType, fileName)) {
      return res.status(400).json({
        error: "Invalid file type",
        message: "File type not allowed",
      });
    }

    //! sanitize filename
    const sanitizedFileName = sanitizedFileName(fileName);

    //! initialize upload session -- start service
    const result = "";
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
async function uploadChunk(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}
async function getUploadsStatus(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}
async function finalizeUpload(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}
async function cancelUpload(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initializeUpload,
  uploadChunk,
  finalizeUpload,
  cancelUpload,
  getUploadsStatus,
};
