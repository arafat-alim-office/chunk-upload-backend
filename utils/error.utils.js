class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class UnsupportedFileTypeError extends AppError {
  constructor(message = "Unsupported file type") {
    super(message, 400);
    this.name = "UnsupportedFileTypeError";
  }
}

class FileSizeLimitExceededError extends AppError {
  constructor(message = "File size limit exceeded") {
    super(message, 413);
    this.name = "FileSizeLimitExceeded";
  }
}

module.exports = {
  AppError,
  UnsupportedFileTypeError,
  FileSizeLimitExceededError,
};
