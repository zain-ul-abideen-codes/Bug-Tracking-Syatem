const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const Bug = require("../models/Bug");
const Project = require("../models/Project");
const { parseNaturalBugReport } = require("../services/naturalBugReportService");
const { generateResolutionCopilot } = require("../services/resolutionCopilotService");
const { ROLES } = require("../utils/constants");

const canAccessProject = (project, user) => {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) return String(project.manager) === String(user._id);
  if (user.role === ROLES.QA) return project.qaEngineers.some((id) => String(id) === String(user._id));
  return false;
};

const parseBugReport = asyncHandler(async (req, res) => {
  const naturalText = req.body.naturalText?.trim();
  const projectId = req.body.projectId?.trim();

  if (!naturalText) {
    throw new ApiError(400, "Natural language bug report text is required.");
  }

  if (!projectId) {
    throw new ApiError(400, "Project is required.");
  }

  const project = await Project.findOne({ _id: projectId, isArchived: { $ne: true } }).select(
    "_id title manager qaEngineers"
  );

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (!canAccessProject(project, req.user)) {
    throw new ApiError(403, "You cannot create reports for this project.");
  }

  const parsed = await parseNaturalBugReport({ naturalText });
  res.status(200).json({ report: parsed, confidence: parsed.confidence });
});

const canAccessBugCopilot = (bug, user) => {
  if (user.role === ROLES.DEVELOPER) {
    const assignedDeveloperId = bug.assignedDeveloper?._id || bug.assignedDeveloper;
    return String(assignedDeveloperId) === String(user._id);
  }

  return false;
};

const resolutionCopilot = asyncHandler(async (req, res) => {
  const bugId = req.body.bugId?.trim();

  if (!bugId) {
    throw new ApiError(400, "Bug ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(bugId)) {
    throw new ApiError(400, "Invalid bug ID supplied.");
  }

  const bug = await Bug.findOne({ _id: bugId, isArchived: { $ne: true } })
    .populate("project", "title description manager developers")
    .populate("assignedDeveloper", "name email role")
    .populate("createdBy", "name email role")
    .lean();

  if (!bug) {
    throw new ApiError(404, "Issue not found.");
  }

  if (!canAccessBugCopilot(bug, req.user)) {
    throw new ApiError(403, "You cannot use Resolution Copilot for this issue.");
  }

  const copilot = await generateResolutionCopilot(bug);
  res.status(200).json({
    success: true,
    bugId: bug._id,
    bugTitle: bug.title,
    copilot,
  });
});

module.exports = {
  parseBugReport,
  resolutionCopilot,
};
