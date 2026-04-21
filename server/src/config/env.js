const path = require("path");
const dotenv = require("dotenv");

const rootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
const localEnvPath = path.resolve(process.cwd(), ".env");

dotenv.config({
  path: require("fs").existsSync(rootEnvPath) ? rootEnvPath : localEnvPath,
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "refreshToken",
  uploadDir:
    process.env.UPLOAD_DIR ||
    path.resolve(__dirname, "..", "uploads"),
  seedAdminName: process.env.SEED_ADMIN_NAME,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
};

const requiredKeys = [
  "mongoUri",
  "accessSecret",
  "refreshSecret",
  "seedAdminEmail",
  "seedAdminPassword",
];

requiredKeys.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable for ${key}`);
  }
});

module.exports = env;
