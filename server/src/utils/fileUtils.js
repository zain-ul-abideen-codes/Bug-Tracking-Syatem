const fs = require("fs");
const path = require("path");
const env = require("../config/env");

const removeFileIfExists = async (filePath) => {
  if (!filePath) {
    return;
  }

  const resolvedPath = filePath.startsWith("/uploads/")
    ? path.resolve(env.uploadDir, path.basename(filePath))
    : path.resolve(filePath);

  if (fs.existsSync(resolvedPath)) {
    await fs.promises.unlink(resolvedPath);
  }
};

module.exports = {
  removeFileIfExists,
};
