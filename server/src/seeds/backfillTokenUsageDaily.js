const mongoose = require("mongoose");
const connectDB = require("../config/db");
const env = require("../config/env");
const AuditLog = require("../models/AuditLog");
const TokenUsageDaily = require("../models/TokenUsageDaily");
const { calculateEstimatedCostUSD } = require("../services/tokenUsageService");

const backfillTokenUsageDaily = async () => {
  try {
    await connectDB(env.mongoUri);

    const rows = await AuditLog.aggregate([
      { $match: { userId: { $ne: null } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: 1,
          userRole: { $ifNull: ["$user.role", "unknown"] },
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$timestamp", "$createdAt"] },
            },
          },
          tokensUsed: { $ifNull: ["$tokensUsed", 0] },
          promptTokens: { $ifNull: ["$promptTokens", 0] },
          completionTokens: { $ifNull: ["$completionTokens", 0] },
        },
      },
      {
        $group: {
          _id: { userId: "$userId", date: "$date" },
          userRole: { $last: "$userRole" },
          totalTokens: {
            $sum: {
              $max: ["$tokensUsed", { $add: ["$promptTokens", "$completionTokens"] }],
            },
          },
          totalRequests: { $sum: 1 },
          totalPromptTokens: { $sum: "$promptTokens" },
          totalCompletionTokens: { $sum: "$completionTokens" },
        },
      },
    ]);

    if (!rows.length) {
      console.log("No audit logs found. token_usage_daily backfill skipped.");
      return;
    }

    const operations = rows.map((row) => ({
      updateOne: {
        filter: { userId: row._id.userId, date: row._id.date },
        update: {
          $set: {
            userId: row._id.userId,
            userRole: row.userRole,
            date: row._id.date,
            totalTokens: row.totalTokens || 0,
            totalRequests: row.totalRequests || 0,
            totalPromptTokens: row.totalPromptTokens || 0,
            totalCompletionTokens: row.totalCompletionTokens || 0,
            estimatedCostUSD: calculateEstimatedCostUSD(row.totalPromptTokens, row.totalCompletionTokens),
          },
        },
        upsert: true,
      },
    }));

    await TokenUsageDaily.bulkWrite(operations);
    console.log(`token_usage_daily backfilled successfully. Rows updated: ${operations.length}`);
  } finally {
    await mongoose.connection.close();
  }
};

backfillTokenUsageDaily().catch((error) => {
  console.error("Failed to backfill token_usage_daily:", error);
  process.exit(1);
});
