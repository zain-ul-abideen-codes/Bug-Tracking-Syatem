const express = require("express");
const rateLimit = require("express-rate-limit");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const env = require("../config/env");
const { ROLES } = require("../utils/constants");
const {
  streamChatWithAgent,
  getAgentSessions,
  removeAgentSession,
  getAgentAuditLogs,
  getAgentAuditStatistics,
  getAgentHealth,
} = require("../controllers/agentController");

const router = express.Router();

const agentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(env.agentRateLimitPerMinute || 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || "anonymous"),
  message: {
    message: "Too many AI agent requests. Please wait a minute and try again.",
  },
});

/**
 * @route POST /api/agent/chat
 * @access Protected
 * @returns {text/event-stream}
 */
router.post("/chat", authenticate, agentRateLimiter, streamChatWithAgent);

/**
 * @route GET /api/agent/sessions
 * @access Protected
 * @returns {object}
 */
router.get("/sessions", authenticate, getAgentSessions);

/**
 * @route DELETE /api/agent/sessions/:id
 * @access Protected
 * @returns {object}
 */
router.delete("/sessions/:id", authenticate, removeAgentSession);

/**
 * @route GET /api/agent/audit
 * @access Admin
 * @returns {object}
 */
router.get("/audit", authenticate, authorize(ROLES.ADMIN), getAgentAuditLogs);

/**
 * @route GET /api/agent/audit/stats
 * @access Admin
 * @returns {object}
 */
router.get("/audit/stats", authenticate, authorize(ROLES.ADMIN), getAgentAuditStatistics);

/**
 * @route GET /api/agent/health
 * @access Protected
 * @returns {object}
 */
router.get("/health", authenticate, getAgentHealth);

module.exports = router;
