const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const Project = require("../models/Project");
const Bug = require("../models/Bug");

const seedSampleData = async () => {
  try {
    await connectDB(env.mongoUri);

    const [admin, manager, qa, developer] = await Promise.all([
      User.findOne({ email: "admin@example.com" }),
      User.findOne({ email: "manager@example.com" }),
      User.findOne({ email: "qa@example.com" }),
      User.findOne({ email: "developer@example.com" }),
    ]);

    if (!admin || !manager || !qa || !developer) {
      throw new Error("Seed admin and demo users first.");
    }

    let project = await Project.findOne({ title: "Apollo Platform Revamp" });

    if (!project) {
      project = await Project.create({
        title: "Apollo Platform Revamp",
        description: "Flagship sample project for dashboard analytics, assignments, and bug workflow testing.",
        manager: manager._id,
        qaEngineers: [qa._id],
        developers: [developer._id],
      });
      console.log("Created sample project.");
    } else {
      project.description =
        "Flagship sample project for dashboard analytics, assignments, and bug workflow testing.";
      project.manager = manager._id;
      project.qaEngineers = [qa._id];
      project.developers = [developer._id];
      await project.save();
      console.log("Updated sample project.");
    }

    const issues = [
      {
        title: "Login form does not show API error details",
        type: "bug",
        status: "reopened",
        description: "Users need clearer authentication feedback when credentials fail.",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: qa._id,
        assignedDeveloper: developer._id,
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
        type: "feature",
        status: "started",
        description: "Expose role-aware progress summary cards and project health snapshot.",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: admin._id,
        assignedDeveloper: developer._id,
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
        type: "bug",
        status: "resolved",
        description: "Prevent invalid developer assignment when project members change.",
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: qa._id,
        assignedDeveloper: developer._id,
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

    console.log("Sample data seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed sample data:", error.message);
    process.exit(1);
  }
};

seedSampleData();
