const ApiError = require("../utils/apiError");
const {
  runAgent,
  listSessions,
  deleteSession,
  getAuditLogs,
  getAuditStats,
  getHealth,
} = require("../services/agentService");

const streamChatWithAgent = async (req, res) => {
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
    });
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
  getAgentHealth,
};
