const ApiError = require("../utils/apiError");
const AuditLog = require("../models/AuditLog");
const { recordTokenUsageDaily } = require("../services/tokenUsageService");
const {
  runAgent,
  listSessions,
  deleteSession,
  getAuditLogs,
  getAuditStats,
  getTokenUsageDashboard,
  getHealth,
} = require("../services/agentService");

const streamChatWithAgent = async (req, res) => {
  const startedAt = Date.now();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const { message, sessionId } = req.body || {};
    await runAgent({
      user: req.user,
      message,
      sessionId,
      res,
      requestMeta: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
      },
    });
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error?.message || "Failed to process AI agent request.";
    try {
      await AuditLog.create({
        userId: req.user?._id,
        sessionId: req.body?.sessionId || null,
        toolName: "agent_failure",
        toolInput: { message: req.body?.message || "" },
        toolOutput: null,
        success: false,
        errorMessage: message,
        latencyMs: Date.now() - startedAt,
        responseTimeMs: Date.now() - startedAt,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        modelUsed: "gpt-4o",
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
        timestamp: new Date(),
      });
      await recordTokenUsageDaily({
        userId: req.user?._id,
        userRole: req.user?.role,
        promptTokens: 0,
        completionTokens: 0,
        tokensUsed: 0,
      });
    } catch (_auditError) {
      // The user-facing error should still be sent even if audit persistence fails.
    }
    res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
  } finally {
    res.end();
  }
};

const getAgentSessions = async (req, res, next) => {
  try {
    const sessions = await listSessions(String(req.user._id));
    res.status(200).json({ items: sessions });
  } catch (error) {
    next(error);
  }
};

const removeAgentSession = async (req, res, next) => {
  try {
    await deleteSession(String(req.user._id), req.params.id);
    res.status(200).json({ message: "Agent session deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const getAgentAuditLogs = async (req, res, next) => {
  try {
    const payload = await getAuditLogs({
      page: req.query.page,
      limit: req.query.limit,
      role: req.query.role,
      tool: req.query.tool,
      success: req.query.success,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

const getAgentTokenUsage = async (_req, res, next) => {
  try {
    const payload = await getTokenUsageDashboard();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

const getAgentAuditStatistics = async (_req, res, next) => {
  try {
    const payload = await getAuditStats();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

const getAgentHealth = async (_req, res, next) => {
  try {
    const payload = await getHealth();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamChatWithAgent,
  getAgentSessions,
  removeAgentSession,
  getAgentAuditLogs,
  getAgentAuditStatistics,
  getAgentTokenUsage,
  getAgentHealth,
};
