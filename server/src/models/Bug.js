const mongoose = require("mongoose");
const { BUG_STATUS, BUG_TYPES } = require("../utils/constants");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bug", bugSchema);
