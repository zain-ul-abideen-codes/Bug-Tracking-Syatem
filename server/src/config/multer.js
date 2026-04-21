const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/apiError");
const env = require("./env");

const allowedMimeTypes = ["image/png", "image/gif"];
const allowedExtensions = [".png", ".gif"];

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const validMime = allowedMimeTypes.includes(file.mimetype);
  const validExt = allowedExtensions.includes(ext);

  if (!validMime || !validExt) {
    cb(new ApiError(400, "Only PNG and GIF screenshots are allowed."));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
