const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const Bug = require("../models/Bug");
const Project = require("../models/Project");
const { BUG_PRIORITY, BUG_STATUS, ROLES } = require("../utils/constants");
const { removeFileIfExists } = require("../utils/fileUtils");
const { validateBugInput } = require("../validators/bugValidator");
const { suggestBugPriority: analyzeBugPriority } = require("../services/prioritySuggestionService");

const bugPopulate = [
  { path: "project", select: "title" },
  { path: "assignedDeveloper", select: "name email role" },
  { path: "createdBy", select: "name email role" },
  { path: "comments.author", select: "name email role" },
  { path: "activity.actor", select: "name email role" },
];

const pushActivity = (bug, actorId, action, message) => {
  bug.activity.push({
    actor: actorId,
    action,
    message,
  });
};

const canAccessProject = (project, user) => {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) return String(project.manager) === String(user._id);
  if (user.role === ROLES.QA) return project.qaEngineers.some((id) => String(id) === String(user._id));
  if (user.role === ROLES.DEVELOPER)
    return project.developers.some((id) => String(id) === String(user._id));
  return false;
};

const normalizePriorityPayload = (body = {}) => {
  const priority = BUG_PRIORITY.includes(body.priority) ? body.priority : "Medium";
  const prioritySource = body.prioritySource === "ai" ? "ai" : "manual";
  const confidence = Number(body.aiConfidence);

  return {
    priority,
    prioritySource,
    aiSuggestedPriority: BUG_PRIORITY.includes(body.aiSuggestedPriority) ? body.aiSuggestedPriority : null,
    aiConfidence: body.aiConfidence === undefined || body.aiConfidence === "" || Number.isNaN(confidence)
      ? null
      : Math.min(100, Math.max(0, Math.round(confidence))),
    aiReason: body.aiReason?.trim() || "",
  };
};

const listBugs = asyncHandler(async (req, res) => {
  let query = { isArchived: { $ne: true } };

  if (req.user.role === ROLES.DEVELOPER) {
    query = { isArchived: { $ne: true }, assignedDeveloper: req.user._id };
  }

  if (req.user.role === ROLES.QA) {
    const projects = await Project.find({ isArchived: { $ne: true }, qaEngineers: req.user._id }).select("_id");
    query = { isArchived: { $ne: true }, project: { $in: projects.map((item) => item._id) } };
  }

  if (req.user.role === ROLES.MANAGER) {
    const projects = await Project.find({ isArchived: { $ne: true }, manager: req.user._id }).select("_id");
    query = { isArchived: { $ne: true }, project: { $in: projects.map((item) => item._id) } };
  }

  const bugs = await Bug.find(query).populate(bugPopulate).sort({ createdAt: -1 });
  res.status(200).json({ bugs });
});

const createBug = asyncHandler(async (req, res) => {
  const errors = validateBugInput(req.body);
  if (Object.keys(errors).length) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const project = await Project.findOne({ _id: req.body.project, isArchived: { $ne: true } });
  if (!project) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(404, "Project not found.");
  }

  if (!canAccessProject(project, req.user)) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(403, "You cannot create issues in this project.");
  }

  if (req.user.role === ROLES.MANAGER && req.file) {
    await removeFileIfExists(req.file.path);
    throw new ApiError(403, "Managers cannot upload issue screenshots.");
  }

  if (
    req.body.assignedDeveloper &&
    !project.developers.some((id) => String(id) === String(req.body.assignedDeveloper))
  ) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(400, "Assigned developer must belong to the selected project.");
  }

  const bug = await Bug.create({
    title: req.body.title,
    type: req.body.type,
    status: req.body.status,
    ...normalizePriorityPayload(req.body),
    project: req.body.project,
    description: req.body.description || "",
    stepsToReproduce: req.body.stepsToReproduce || "",
    expectedResult: req.body.expectedResult || "",
    actualResult: req.body.actualResult || "",
    deadline: req.body.deadline || null,
    screenshot: req.file ? `/uploads/${req.file.filename}` : null,
    assignedDeveloper: req.body.assignedDeveloper || null,
    createdBy: req.user._id,
    aiGenerated: req.body.aiGenerated === "true" || req.body.aiGenerated === true,
    activity: [
      {
        actor: req.user._id,
        action: "created",
        message: `${req.user.name} created this ${req.body.type}.`,
      },
    ],
  });

  const populated = await Bug.findById(bug._id).populate(bugPopulate);
  res.status(201).json({ message: "Issue created successfully.", bug: populated });
});

const suggestPriority = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required.");
  }

  try {
    const suggestion = await analyzeBugPriority({ title, description });
    return res.status(200).json(suggestion);
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw new ApiError(502, "Priority suggestion service is temporarily unavailable.");
  }
});

const updateBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isArchived: { $ne: true } }).populate("project");
  if (!bug) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(404, "Issue not found.");
  }

  if (req.user.role === ROLES.DEVELOPER) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }

    const allowedStatuses = BUG_STATUS[bug.type];
    if (String(bug.assignedDeveloper) !== String(req.user._id)) {
      throw new ApiError(403, "Developers can only update assigned issues.");
    }
    if (req.body.status === "reopened") {
      throw new ApiError(403, "Developers cannot reopen issues.");
    }
    if (
      !allowedStatuses.includes(req.body.status) ||
      Object.keys(req.body).some((key) => !["status", "comment"].includes(key))
    ) {
      throw new ApiError(403, "Developers can only change the issue status and add comments.");
    }

    if (req.body.status !== bug.status) {
      pushActivity(
        bug,
        req.user._id,
        "status_changed",
        `${req.user.name} changed status from ${bug.status} to ${req.body.status}.`
      );
    }

    if (req.body.comment?.trim()) {
      bug.comments.push({
        body: req.body.comment.trim(),
        author: req.user._id,
      });
      pushActivity(bug, req.user._id, "comment_added", `${req.user.name} added a comment.`);
    }

    bug.status = req.body.status;
    await bug.save();
    const populated = await Bug.findById(bug._id).populate(bugPopulate);
    return res.status(200).json({ message: "Issue status updated successfully.", bug: populated });
  }

  if (req.user.role === ROLES.QA && String(bug.createdBy) !== String(req.user._id)) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(403, "QA Engineers can only edit issues they created.");
  }

  const mergedBody = {
    title: req.body.title ?? bug.title,
    type: req.body.type ?? bug.type,
    status: req.body.status ?? bug.status,
    project: req.body.project ?? String(bug.project._id),
  };

  const errors = validateBugInput(mergedBody);
  if (Object.keys(errors).length) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const nextProject = await Project.findOne({ _id: mergedBody.project, isArchived: { $ne: true } });
  if (!nextProject) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(404, "Project not found.");
  }

  if (req.user.role === ROLES.QA && !canAccessProject(nextProject, req.user)) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(403, "You cannot move this issue to an unassigned project.");
  }

  if (
    req.body.assignedDeveloper &&
    !nextProject.developers.some((id) => String(id) === String(req.body.assignedDeveloper))
  ) {
    if (req.file) {
      await removeFileIfExists(req.file.path);
    }
    throw new ApiError(400, "Assigned developer must belong to the selected project.");
  }

  const previousStatus = bug.status;
  const previousProjectId = String(bug.project._id || bug.project);
  const previousAssignedDeveloper = String(bug.assignedDeveloper || "");

  bug.title = mergedBody.title;
  bug.type = mergedBody.type;
  bug.status = mergedBody.status;
  if (req.body.priority !== undefined) {
    bug.priority = BUG_PRIORITY.includes(req.body.priority) ? req.body.priority : bug.priority;
  }
  if (req.body.prioritySource !== undefined) {
    bug.prioritySource = req.body.prioritySource === "ai" ? "ai" : "manual";
  }
  if (req.body.aiSuggestedPriority !== undefined) {
    bug.aiSuggestedPriority = BUG_PRIORITY.includes(req.body.aiSuggestedPriority)
      ? req.body.aiSuggestedPriority
      : null;
  }
  if (req.body.aiConfidence !== undefined) {
    const confidence = Number(req.body.aiConfidence);
    bug.aiConfidence = Number.isNaN(confidence) ? null : Math.min(100, Math.max(0, Math.round(confidence)));
  }
  if (req.body.aiReason !== undefined) {
    bug.aiReason = req.body.aiReason?.trim() || "";
  }
  bug.project = mergedBody.project;
  bug.description = req.body.description ?? bug.description;
  bug.stepsToReproduce = req.body.stepsToReproduce ?? bug.stepsToReproduce;
  bug.expectedResult = req.body.expectedResult ?? bug.expectedResult;
  bug.actualResult = req.body.actualResult ?? bug.actualResult;
  bug.deadline = req.body.deadline ?? bug.deadline;
  bug.assignedDeveloper = req.body.assignedDeveloper ?? bug.assignedDeveloper;

  if (mergedBody.status !== previousStatus) {
    pushActivity(
      bug,
      req.user._id,
      "status_changed",
      `${req.user.name} changed status from ${previousStatus} to ${mergedBody.status}.`
    );
  }

  if (mergedBody.project !== previousProjectId) {
    pushActivity(bug, req.user._id, "project_changed", `${req.user.name} moved this issue to another project.`);
  }

  if (req.body.assignedDeveloper !== undefined && String(req.body.assignedDeveloper || "") !== previousAssignedDeveloper) {
    const assignmentMessage = req.body.assignedDeveloper
      ? `${req.user.name} updated the assignee for this issue.`
      : `${req.user.name} removed the assignee from this issue.`;
    pushActivity(bug, req.user._id, "assignee_changed", assignmentMessage);
  }

  if (req.file) {
    await removeFileIfExists(bug.screenshot);
    bug.screenshot = `/uploads/${req.file.filename}`;
    pushActivity(bug, req.user._id, "screenshot_updated", `${req.user.name} updated the screenshot.`);
  }

  if (req.body.comment?.trim()) {
    bug.comments.push({
      body: req.body.comment.trim(),
      author: req.user._id,
    });
    pushActivity(bug, req.user._id, "comment_added", `${req.user.name} added a comment.`);
  }

  await bug.save();

  const populated = await Bug.findById(bug._id).populate(bugPopulate);
  return res.status(200).json({ message: "Issue updated successfully.", bug: populated });
});

const deleteBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isArchived: { $ne: true } });
  if (!bug) {
    throw new ApiError(404, "Issue not found.");
  }

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isCreatorQa =
    req.user.role === ROLES.QA && String(bug.createdBy) === String(req.user._id);

  if (!isAdmin && !isCreatorQa) {
    throw new ApiError(403, "You cannot delete this issue.");
  }

  bug.isArchived = true;
  bug.archivedAt = new Date();
  bug.archivedBy = req.user._id;
  await bug.save();
  res.status(200).json({ message: "Issue archived successfully." });
});

const addComment = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isArchived: { $ne: true } }).populate("project");
  if (!bug) {
    throw new ApiError(404, "Issue not found.");
  }

  const body = req.body.comment?.trim();
  if (!body) {
    throw new ApiError(400, "Comment is required.");
  }

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isCreatorQa = req.user.role === ROLES.QA && String(bug.createdBy) === String(req.user._id);
  const isAssignedDeveloper =
    req.user.role === ROLES.DEVELOPER &&
    String(bug.assignedDeveloper) === String(req.user._id);

  if (!isAdmin && !isCreatorQa && !isAssignedDeveloper) {
    throw new ApiError(403, "You cannot comment on this issue.");
  }

  bug.comments.push({
    body,
    author: req.user._id,
  });
  pushActivity(bug, req.user._id, "comment_added", `${req.user.name} added a comment.`);
  await bug.save();

  const populated = await Bug.findById(bug._id).populate(bugPopulate);
  res.status(200).json({ message: "Comment added successfully.", bug: populated });
});

module.exports = {
  listBugs,
  suggestPriority,
  createBug,
  updateBug,
  deleteBug,
  addComment,
};
