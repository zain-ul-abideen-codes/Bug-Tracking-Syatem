const mongoose = require("mongoose");

const agentMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system", "tool"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    toolName: {
      type: String,
      default: null,
      trim: true,
    },
    toolInput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    toolOutput: {
      type: String,
      default: null,
    },
    tokens: {
      type: Number,
      default: 0,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const agentConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: {
      type: [agentMessageSchema],
      default: [],
    },
    summary: {
      type: String,
      default: null,
    },
    entities: {
      lastMentionedBugId: { type: String, default: null },
      lastMentionedProjectId: { type: String, default: null },
      lastMentionedUserId: { type: String, default: null },
      currentUserGoal: { type: String, default: null },
    },
    pendingAction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    alerted: {
      type: Boolean,
      default: false,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    totalLatencyMs: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    collection: "agent_conversations",
  },
);

agentConversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("AgentConversation", agentConversationSchema);
