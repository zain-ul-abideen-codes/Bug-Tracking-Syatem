const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      trim: true,
    },
    toolName: {
      type: String,
      required: true,
      trim: true,
    },
    toolInput: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    toolOutput: {
      type: String,
      default: null,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "audit_logs",
  },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
