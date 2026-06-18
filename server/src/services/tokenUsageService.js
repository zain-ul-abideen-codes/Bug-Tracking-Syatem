const TokenUsageDaily = require("../models/TokenUsageDaily");

const PROMPT_TOKEN_RATE_PER_1K = 0.005;
const COMPLETION_TOKEN_RATE_PER_1K = 0.015;

const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const calculateEstimatedCostUSD = (promptTokens = 0, completionTokens = 0) =>
  Number(
    (
      (Number(promptTokens || 0) * PROMPT_TOKEN_RATE_PER_1K) / 1000 +
      (Number(completionTokens || 0) * COMPLETION_TOKEN_RATE_PER_1K) / 1000
    ).toFixed(6),
  );

const recordTokenUsageDaily = async ({
  userId,
  userRole,
  promptTokens = 0,
  completionTokens = 0,
  tokensUsed,
  date = new Date(),
}) => {
  if (!userId || !userRole) return;

  const safePromptTokens = Number(promptTokens || 0);
  const safeCompletionTokens = Number(completionTokens || 0);
  const safeTokensUsed = Number(tokensUsed ?? safePromptTokens + safeCompletionTokens);

  await TokenUsageDaily.updateOne(
    { userId, date: toDateKey(date) },
    {
      $setOnInsert: {
        userId,
        userRole,
        date: toDateKey(date),
      },
      $set: { userRole },
      $inc: {
        totalTokens: safeTokensUsed,
        totalRequests: 1,
        totalPromptTokens: safePromptTokens,
        totalCompletionTokens: safeCompletionTokens,
        estimatedCostUSD: calculateEstimatedCostUSD(safePromptTokens, safeCompletionTokens),
      },
    },
    { upsert: true },
  );
};

module.exports = {
  calculateEstimatedCostUSD,
  recordTokenUsageDaily,
  toDateKey,
};
