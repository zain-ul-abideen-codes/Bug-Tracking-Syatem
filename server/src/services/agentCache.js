const NodeCache = require("node-cache");
const env = require("../config/env");

const ttlSeconds = Number(env.agentCacheTtlSeconds || 120);
const cache = new NodeCache({
  stdTTL: ttlSeconds,
  checkperiod: Math.max(30, Math.floor(ttlSeconds / 2)),
  useClones: false,
});

const normalizeMessage = (message) =>
  String(message || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

const shouldCacheMessage = (message) => {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return false;
  }

  if (/\b(today|now|latest)\b/.test(normalized)) {
    return false;
  }

  if (/\b[a-f0-9]{24}\b/i.test(normalized)) {
    return false;
  }

  if (/\b(create|assign|update|delete|remove|change|set)\b/.test(normalized)) {
    return false;
  }

  return [
    "show my projects",
    "show my bugs",
    "dashboard stats",
    "how many bugs are resolved",
  ].some((snippet) => normalized.includes(snippet));
};

const buildCacheKey = ({ userId, role, message }) =>
  `${userId}:${role}:${normalizeMessage(message)}`;

const get = (key) => cache.get(key);
const set = (key, value, ttl) => cache.set(key, value, ttl);
const del = (key) => cache.del(key);
const flushAll = () => cache.flushAll();

const flushUserScope = (userId, role) => {
  const prefix = `${userId}:${role}:`;
  cache.keys().forEach((key) => {
    if (key.startsWith(prefix)) {
      cache.del(key);
    }
  });
};

const getStats = () => ({
  keys: cache.keys().length,
  stats: cache.getStats(),
  ttlSeconds,
});

module.exports = {
  normalizeMessage,
  shouldCacheMessage,
  buildCacheKey,
  get,
  set,
  del,
  flushAll,
  flushUserScope,
  getStats,
};
