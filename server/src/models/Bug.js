const mongoose = require("mongoose");
const { BUG_PRIORITY, BUG_STATUS, BUG_TYPES } = require("../utils/constants");

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(BUG_TYPES),
      required: true,
    },
    status: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return BUG_STATUS[this.type]?.includes(value);
        },
        message: "Invalid status for the selected issue type.",
      },
    },
    priority: {
      type: String,
      enum: BUG_PRIORITY,
      default: "Medium",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    stepsToReproduce: {
      type: String,
      default: "",
      trim: true,
    },
    expectedResult: {
      type: String,
      default: "",
      trim: true,
    },
    actualResult: {
      type: String,
      default: "",
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    screenshot: {
      type: String,
      default: null,
    },
    assignedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    aiSuggestedPriority: {
      type: String,
      enum: BUG_PRIORITY,
      default: null,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiReason: {
      type: String,
      trim: true,
      default: "",
    },
    prioritySource: {
      type: String,
      enum: ["ai", "manual"],
      default: "manual",
    },
    aiGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

bugSchema.index({ title: "text", description: "text" }, { name: "bug_text_search_idx" });

module.exports = mongoose.model("Bug", bugSchema);
