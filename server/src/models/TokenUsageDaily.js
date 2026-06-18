const mongoose = require("mongoose");

const tokenUsageDailySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    totalPromptTokens: {
      type: Number,
      default: 0,
    },
    totalCompletionTokens: {
      type: Number,
      default: 0,
    },
    estimatedCostUSD: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "token_usage_daily",
  },
);

tokenUsageDailySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TokenUsageDaily", tokenUsageDailySchema);
