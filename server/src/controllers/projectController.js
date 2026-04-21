const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const Project = require("../models/Project");
const { ROLES } = require("../utils/constants");
const { validateProjectInput } = require("../validators/projectValidator");

const projectPopulate = [
  { path: "manager", select: "name email role" },
  { path: "qaEngineers", select: "name email role" },
  { path: "developers", select: "name email role" },
];

const listProjects = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === ROLES.MANAGER) {
    query = { $or: [{ manager: req.user._id }] };
  }

  if (req.user.role === ROLES.QA) {
    query = { qaEngineers: req.user._id };
  }

  if (req.user.role === ROLES.DEVELOPER) {
    query = { developers: req.user._id };
  }

  const projects = await Project.find(query).populate(projectPopulate).sort({ createdAt: -1 });
  res.status(200).json({ projects });
});

const createProject = asyncHandler(async (req, res) => {
  const errors = validateProjectInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const existingProject = await Project.findOne({ title: req.body.title.trim() });
  if (existingProject) {
    throw new ApiError(409, "Project title must be unique.");
  }

  const project = await Project.create({
    title: req.body.title.trim(),
    description: req.body.description || "",
    manager: req.user.role === ROLES.MANAGER ? req.user._id : req.body.manager || null,
    qaEngineers: req.body.qaEngineers || [],
    developers: req.body.developers || [],
  });

  const populated = await Project.findById(project._id).populate(projectPopulate);
  res.status(201).json({ message: "Project created successfully.", project: populated });
});

const updateProject = asyncHandler(async (req, res) => {
  const errors = validateProjectInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (req.body.title.trim() !== project.title) {
    const existingProject = await Project.findOne({ title: req.body.title.trim() });
    if (existingProject) {
      throw new ApiError(409, "Project title must be unique.");
    }
  }

  if (req.user.role === ROLES.MANAGER && String(project.manager) !== String(req.user._id)) {
    throw new ApiError(403, "Managers can only update their own projects.");
  }

  project.title = req.body.title.trim();
  project.description = req.body.description || "";
  project.manager = req.user.role === ROLES.MANAGER ? req.user._id : req.body.manager || null;
  project.qaEngineers = req.body.qaEngineers || [];
  project.developers = req.body.developers || [];
  await project.save();

  const populated = await Project.findById(project._id).populate(projectPopulate);
  res.status(200).json({ message: "Project updated successfully.", project: populated });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (req.user.role === ROLES.MANAGER && String(project.manager) !== String(req.user._id)) {
    throw new ApiError(403, "Managers can only delete their own projects.");
  }

  await project.deleteOne();
  res.status(200).json({ message: "Project deleted successfully." });
});

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
};
