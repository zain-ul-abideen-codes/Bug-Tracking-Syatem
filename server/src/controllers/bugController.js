const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const Bug = require("../models/Bug");
const Project = require("../models/Project");
const { BUG_STATUS, ROLES } = require("../utils/constants");
const { removeFileIfExists } = require("../utils/fileUtils");
const { validateBugInput } = require("../validators/bugValidator");

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

const listBugs = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === ROLES.DEVELOPER) {
    query = { assignedDeveloper: req.user._id };
  }

  if (req.user.role === ROLES.QA) {
    const projects = await Project.find({ qaEngineers: req.user._id }).select("_id");
    query = { project: { $in: projects.map((item) => item._id) } };
  }

  if (req.user.role === ROLES.MANAGER) {
    const projects = await Project.find({ manager: req.user._id }).select("_id");
    query = { project: { $in: projects.map((item) => item._id) } };
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

  const project = await Project.findById(req.body.project);
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
    project: req.body.project,
    description: req.body.description || "",
    deadline: req.body.deadline || null,
    screenshot: req.file ? `/uploads/${req.file.filename}` : null,
    assignedDeveloper: req.body.assignedDeveloper || null,
    createdBy: req.user._id,
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

const updateBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id).populate("project");
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

  const nextProject = await Project.findById(mergedBody.project);
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

  bug.title = mergedBody.title;
  bug.type = mergedBody.type;
  bug.status = mergedBody.status;
  bug.project = mergedBody.project;
  bug.description = req.body.description ?? bug.description;
  bug.deadline = req.body.deadline ?? bug.deadline;
  bug.assignedDeveloper = req.body.assignedDeveloper ?? bug.assignedDeveloper;

  if (mergedBody.status !== bug.status) {
    pushActivity(
      bug,
      req.user._id,
      "status_changed",
      `${req.user.name} changed status from ${bug.status} to ${mergedBody.status}.`
    );
  }

  if (mergedBody.project !== String(bug.project._id || bug.project)) {
    pushActivity(bug, req.user._id, "project_changed", `${req.user.name} moved this issue to another project.`);
  }

  if (req.body.assignedDeveloper !== undefined && String(req.body.assignedDeveloper || "") !== String(bug.assignedDeveloper || "")) {
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
  const bug = await Bug.findById(req.params.id);
  if (!bug) {
    throw new ApiError(404, "Issue not found.");
  }

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isCreatorQa =
    req.user.role === ROLES.QA && String(bug.createdBy) === String(req.user._id);

  if (!isAdmin && !isCreatorQa) {
    throw new ApiError(403, "You cannot delete this issue.");
  }

  await removeFileIfExists(bug.screenshot);
  await bug.deleteOne();
  res.status(200).json({ message: "Issue deleted successfully." });
});

const addComment = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id).populate("project");
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
  createBug,
  updateBug,
  deleteBug,
  addComment,
};
