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
  openAiApiKey: process.env.OPENAI_API_KEY,
  agentModel: process.env.AGENT_MODEL || "gpt-4o",
  agentMaxTokens: process.env.AGENT_MAX_TOKENS || "1000",
  agentTemperature: process.env.AGENT_TEMPERATURE || "0",
  agentMaxIterations: process.env.AGENT_MAX_ITERATIONS || "6",
  agentSessionTtlDays: process.env.AGENT_SESSION_TTL_DAYS || "7",
  agentCacheTtlSeconds: process.env.AGENT_CACHE_TTL_SECONDS || "120",
  agentRateLimitPerMinute: process.env.AGENT_RATE_LIMIT_PER_MINUTE || "30",
  agentStream: process.env.AGENT_STREAM || "true",
  agentIntentClassifier: process.env.AGENT_INTENT_CLASSIFIER || "true",
  agentProactiveAlerts: process.env.AGENT_PROACTIVE_ALERTS || "true",
  agentVoiceInput: process.env.AGENT_VOICE_INPUT || "true",
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
