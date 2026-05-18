const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const Project = require("../models/Project");
const Bug = require("../models/Bug");
const { ROLES, BUG_TYPES } = require("../utils/constants");

const demoUsers = [
  {
    name: env.seedAdminName || "System Administrator",
    email: env.seedAdminEmail.toLowerCase(),
    password: env.seedAdminPassword,
    role: ROLES.ADMIN,
  },
  {
    name: "Project Manager",
    email: "manager@example.com",
    password: "Manager@123",
    role: ROLES.MANAGER,
  },
  {
    name: "QA Engineer",
    email: "qa@example.com",
    password: "Qa@123456",
    role: ROLES.QA,
  },
  {
    name: "Developer User",
    email: "developer@example.com",
    password: "Developer@123",
    role: ROLES.DEVELOPER,
  },
];

const buildIssues = ({ admin, qa, developer, projectId }) => [
  {
    title: "Login form does not show API error details",
    type: BUG_TYPES.BUG,
    status: "reopened",
    description: "Users need clearer authentication feedback when credentials fail.",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    project: projectId,
    createdBy: qa._id,
    assignedDeveloper: developer._id,
    screenshot: null,
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    comments: [
      {
        body: "Issue reproduced again after developer marked it resolved. Please review the auth flow once more.",
        author: qa._id,
      },
    ],
    activity: [
      {
        actor: qa._id,
        action: "created",
        message: "QA Engineer created this bug.",
      },
      {
        actor: developer._id,
        action: "status_changed",
        message: "Developer User changed status from started to resolved.",
      },
      {
        actor: qa._id,
        action: "status_changed",
        message: "QA Engineer changed status from resolved to reopened.",
      },
    ],
  },
  {
    title: "Build sprint summary widget for leadership dashboard",
    type: BUG_TYPES.FEATURE,
    status: "started",
    description: "Expose role-aware progress summary cards and project health snapshot.",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    project: projectId,
    createdBy: admin._id,
    assignedDeveloper: developer._id,
    screenshot: null,
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    comments: [
      {
        body: "Start with dashboard cards and then move to trend visualization.",
        author: admin._id,
      },
    ],
    activity: [
      {
        actor: admin._id,
        action: "created",
        message: "System Administrator created this feature request.",
      },
    ],
  },
  {
    title: "Project edit modal needs assignee validation",
    type: BUG_TYPES.BUG,
    status: "resolved",
    description: "Prevent invalid developer assignment when project members change.",
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    project: projectId,
    createdBy: qa._id,
    assignedDeveloper: developer._id,
    screenshot: null,
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    comments: [
      {
        body: "Validation now blocks assigning developers outside the project team.",
        author: developer._id,
      },
    ],
    activity: [
      {
        actor: qa._id,
        action: "created",
        message: "QA Engineer created this bug.",
      },
      {
        actor: developer._id,
        action: "status_changed",
        message: "Developer User changed status from started to resolved.",
      },
    ],
  },
];

const upsertUser = async (seedUser) => {
  const existing = await User.findOne({ email: seedUser.email.toLowerCase() });

  if (existing) {
    existing.name = seedUser.name;
    existing.email = seedUser.email.toLowerCase();
    existing.password = seedUser.password;
    existing.role = seedUser.role;
    existing.refreshToken = null;
    await existing.save();
    console.log(`Updated user: ${seedUser.email}`);
    return existing;
  }

  const created = await User.create({
    ...seedUser,
    email: seedUser.email.toLowerCase(),
  });
  console.log(`Created user: ${seedUser.email}`);
  return created;
};

const seedDefaults = async () => {
  try {
    await connectDB(env.mongoUri);

    const [admin, manager, qa, developer] = await Promise.all(demoUsers.map((seedUser) => upsertUser(seedUser)));

    let project = await Project.findOne({ title: "Apollo Platform Revamp" });

    if (!project) {
      project = await Project.create({
        title: "Apollo Platform Revamp",
        description: "Flagship sample project for dashboard analytics, assignments, and bug workflow testing.",
        manager: manager._id,
        qaEngineers: [qa._id],
        developers: [developer._id],
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      });
      console.log("Created default project: Apollo Platform Revamp");
    } else {
      project.description = "Flagship sample project for dashboard analytics, assignments, and bug workflow testing.";
      project.manager = manager._id;
      project.qaEngineers = [qa._id];
      project.developers = [developer._id];
      project.isArchived = false;
      project.archivedAt = null;
      project.archivedBy = null;
      await project.save();
      console.log("Updated default project: Apollo Platform Revamp");
    }

    const issues = buildIssues({ admin, qa, developer, projectId: project._id });

    for (const issue of issues) {
      const existing = await Bug.findOne({ title: issue.title, project: project._id });
      if (existing) {
        Object.assign(existing, issue);
        await existing.save();
        console.log(`Updated issue: ${issue.title}`);
      } else {
        await Bug.create(issue);
        console.log(`Created issue: ${issue.title}`);
      }
    }

    console.log("Default seed data restored successfully.");
    console.log("Roles used by this seed:", Object.values(ROLES).join(", "));
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed default data:", error.message);
    process.exit(1);
  }
};

seedDefaults();
