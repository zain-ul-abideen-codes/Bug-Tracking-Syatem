const asyncHandler = require("../utils/asyncHandler");
const Bug = require("../models/Bug");
const Project = require("../models/Project");
const { ROLES } = require("../utils/constants");

const buildDateSeries = (days = 7) => {
  const series = [];
  const today = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    series.push({
      isoDate: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
    });
  }

  return series;
};

const mapTrendSeries = (trendData, days) =>
  buildDateSeries(days).map((day) => {
    const match = trendData.find((item) => item.date === day.isoDate);
    return {
      name: day.label,
      value: match?.value || 0,
    };
  });

const getDashboardData = asyncHandler(async (req, res) => {
  let projectFilter = {};
  let bugFilter = {};
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const resolvedTodayPattern = /to (resolved|completed)\.?$/i;

  if (req.user.role === ROLES.MANAGER) {
    const projects = await Project.find({ manager: req.user._id }).select("_id");
    const ids = projects.map((project) => project._id);
    projectFilter = { _id: { $in: ids } };
    bugFilter = { project: { $in: ids } };
  }

  if (req.user.role === ROLES.QA) {
    const projects = await Project.find({ qaEngineers: req.user._id }).select("_id");
    const ids = projects.map((project) => project._id);
    projectFilter = { _id: { $in: ids } };
    bugFilter = { project: { $in: ids } };
  }

  if (req.user.role === ROLES.DEVELOPER) {
    const projects = await Project.find({ developers: req.user._id }).select("_id");
    const ids = projects.map((project) => project._id);
    projectFilter = { _id: { $in: ids } };
    bugFilter = { project: { $in: ids } };
  }

  const [
    statusDistribution,
    typeDistribution,
    countPerProject,
    recentIssues,
    trendData,
    projectCount,
    issueCount,
    openCount,
    completedCount,
    completedTodayActivity,
    overdueCount,
    assignedToMeCount,
  ] =
    await Promise.all([
      Bug.aggregate([
        { $match: bugFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", value: "$count" } },
      ]),
      Bug.aggregate([
        { $match: bugFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", value: "$count" } },
      ]),
      Bug.aggregate([
        { $match: bugFilter },
        { $group: { _id: "$project", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "projects",
            localField: "_id",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        { $project: { _id: 0, name: "$project.title", value: "$count" } },
      ]),
      Bug.find(bugFilter)
        .populate([
          { path: "project", select: "title" },
          { path: "assignedDeveloper", select: "name" },
        ])
        .sort({ createdAt: -1 })
        .limit(6)
        .select("title type status deadline createdAt project assignedDeveloper"),
      Bug.aggregate([
        { $match: bugFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: "$_id", value: "$count" } },
      ]),
      Project.countDocuments(projectFilter),
      Bug.countDocuments(bugFilter),
      Bug.countDocuments({
        ...bugFilter,
        status: { $in: ["new", "started", "reopened"] },
      }),
      Bug.countDocuments({
        ...bugFilter,
        status: { $in: ["resolved", "completed"] },
      }),
      Bug.aggregate([
        { $match: bugFilter },
        { $unwind: "$activity" },
        {
          $match: {
            "activity.action": "status_changed",
            "activity.createdAt": { $gte: startOfToday, $lte: endOfToday },
            "activity.message": resolvedTodayPattern,
          },
        },
        { $group: { _id: "$_id" } },
        { $count: "count" },
      ]),
      Bug.countDocuments({
        ...bugFilter,
        deadline: { $lt: new Date() },
        status: { $nin: ["resolved", "completed"] },
      }),
      Bug.countDocuments(
        req.user.role === ROLES.DEVELOPER
          ? { project: bugFilter.project?.$in ? { $in: bugFilter.project.$in } : bugFilter.project, assignedDeveloper: req.user._id }
          : { assignedDeveloper: req.user._id },
      ),
    ]);

  const velocitySeries = mapTrendSeries(trendData, 7);
  const velocitySeries30 = mapTrendSeries(trendData, 30);

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  res.status(200).json({
    metrics: {
      projectCount,
      issueCount,
      openCount,
      completedCount,
      completedTodayCount: completedTodayActivity[0]?.count || 0,
      overdueCount,
      assignedToMeCount,
    },
    charts: {
      statusDistribution,
      typeDistribution,
      countPerProject,
      velocitySeries,
      velocitySeries30,
    },
    recentIssues,
  });
});

module.exports = {
  getDashboardData,
};
