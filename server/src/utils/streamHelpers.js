const writeEvent = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const streamToken = (res, content) => {
  const tokenText = String(content || "");
  if (!tokenText) {
    return;
  }

  writeEvent(res, { type: "token", content: tokenText });
};

const streamToolStart = (res, tool) => {
  writeEvent(res, { type: "tool_start", tool });
};

const streamToolEnd = (res, tool, resultCount = 0, latencyMs = 0) => {
  writeEvent(res, {
    type: "tool_end",
    tool,
    result_count: resultCount,
    latencyMs,
  });
};

const streamSuggestions = (res, items = []) => {
  if (!items.length) {
    return;
  }

  writeEvent(res, { type: "suggestions", items });
};

const streamAlert = (res, alert) => {
  writeEvent(res, { type: "alert", ...alert });
};

const streamDone = (res, sessionId, toolsUsed = [], meta = {}) => {
  writeEvent(res, {
    type: "done",
    sessionId,
    toolsUsed,
    ...meta,
  });
};

const streamError = (res, message) => {
  writeEvent(res, { type: "error", message });
};

module.exports = {
  writeEvent,
  streamToken,
  streamToolStart,
  streamToolEnd,
  streamSuggestions,
  streamAlert,
  streamDone,
  streamError,
};
