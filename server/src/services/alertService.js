const Bug = require("../models/Bug");
const Project = require("../models/Project");
const { ROLES } = require("../utils/constants");

const buildScope = async (userId, role) => {
  if (role === ROLES.ADMIN) {
    return {};
  }

  if (role === ROLES.MANAGER) {
    const managerProjects = await Project.find({ manager: userId }).select("_id").lean();
    return { project: { $in: managerProjects.map((project) => project._id) } };
  }

  if (role === ROLES.QA) {
    const qaProjects = await Project.find({ qaEngineers: userId }).select("_id").lean();
    return { project: { $in: qaProjects.map((project) => project._id) } };
  }

  return { assignedDeveloper: userId };
};

const getProactiveAlerts = async ({ userId, role }) => {
  const scope = await buildScope(userId, role);
  const now = new Date();
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const baseOpenMatch = {
    ...scope,
    status: { $nin: ["resolved", "completed"] },
  };

  const checks = [
    Bug.countDocuments({
      ...baseOpenMatch,
      deadline: { $lt: now },
    }),
  ];

  if ([ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
    checks.push(
      Bug.countDocuments({
        ...scope,
        assignedDeveloper: null,
      }),
    );
    checks.push(
      Bug.countDocuments({
        ...scope,
        status: "started",
        updatedAt: { $lt: oneWeekAgo },
      }),
    );
  } else {
    checks.push(Promise.resolve(0));
    checks.push(Promise.resolve(0));
  }

  if (role === ROLES.DEVELOPER) {
    checks.push(
      Bug.countDocuments({
        assignedDeveloper: userId,
        deadline: { $gte: now, $lte: inThreeDays },
        status: { $nin: ["resolved", "completed"] },
      }),
    );
  } else {
    checks.push(Promise.resolve(0));
  }

  const [overdue, unassigned, staleStarted, dueSoon] = await Promise.all(checks);
  const alerts = [];

  if (overdue > 0) {
    alerts.push({ severity: "warning", message: `You have ${overdue} overdue bugs.` });
  }

  if (unassigned > 0) {
    alerts.push({ severity: "info", message: `${unassigned} bugs are unassigned and need attention.` });
  }

  if (staleStarted > 0) {
    alerts.push({ severity: "warning", message: `${staleStarted} bugs have been in progress for over a week.` });
  }

  if (dueSoon > 0) {
    alerts.push({ severity: "warning", message: `${dueSoon} of your bugs are due within 3 days.` });
  }

  return alerts.slice(0, 4);
};

module.exports = {
  getProactiveAlerts,
};
