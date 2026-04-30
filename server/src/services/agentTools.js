const mongoose = require("mongoose");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const Project = require("../models/Project");
const Bug = require("../models/Bug");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const agentCache = require("./agentCache");
const { BUG_STATUS, BUG_TYPES, ROLES } = require("../utils/constants");
const logger = require("../utils/logger");

const DEFAULT_LIMIT = 20;
let bugTextIndexPromise;

const bugPopulate = [
  { path: "project", select: "title manager qaEngineers developers", populate: { path: "manager", select: "name email role" } },
  { path: "assignedDeveloper", select: "name email role" },
  { path: "createdBy", select: "name email role" },
  { path: "comments.author", select: "name email role" },
  { path: "activity.actor", select: "name email role" },
];

const ensureObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return new mongoose.Types.ObjectId(value);
};

const serialize = (payload) => JSON.stringify(payload);

const textLimit = 8000;
const limitSerializedResult = (payload) => {
  const serialized = JSON.stringify(payload);
  if (serialized.length <= textLimit) {
    return serialized;
  }

  const summary = {
    summary: "Result was summarized because it exceeded the size cap.",
    keys: Object.keys(payload),
    count:
      payload?.data?.length ??
      payload?.bugs?.length ??
      payload?.projects?.length ??
      0,
  };

  return JSON.stringify(summary);
};

const extractResultCount = (data) => {
  if (Array.isArray(data?.data)) {
    return data.data.length;
  }
  if (Array.isArray(data?.bugs)) {
    return data.bugs.length;
  }
  if (Array.isArray(data?.projects)) {
    return data.projects.length;
  }
  if (data?.bug || data?.project) {
    return 1;
  }
  return 0;
};

const ensureBugTextIndex = async () => {
  if (!bugTextIndexPromise) {
    bugTextIndexPromise = Bug.collection
      .createIndex({ title: "text", description: "text" }, { name: "bug_text_search_idx" })
      .catch(() => null);
  }

  await bugTextIndexPromise;
};

const getVisibleProjectScopeQuery = (context) => {
  if ([ROLES.ADMIN, ROLES.MANAGER].includes(context.role)) {
    return {};
  }

  if (context.role === ROLES.QA) {
    return { qaEngineers: context.userId };
  }

  if (context.role === ROLES.DEVELOPER) {
    return { developers: context.userId };
  }

  return { _id: { $in: [] } };
};

const getProjectIdsForRole = async (context) => {
  if ([ROLES.ADMIN, ROLES.MANAGER].includes(context.role)) {
    const projects = await Project.find({}).select("_id").lean();
    return projects.map((project) => project._id);
  }

  if (context.role === ROLES.QA) {
    const projects = await Project.find({ qaEngineers: context.userId }).select("_id").lean();
    return projects.map((project) => project._id);
  }

  const projects = await Project.find({ developers: context.userId }).select("_id").lean();
  return projects.map((project) => project._id);
};

const buildBugScopeQuery = async (context, filters = {}) => {
  const query = { ...filters };

  if (context.role === ROLES.ADMIN) {
    return query;
  }

  if (context.role === ROLES.MANAGER) {
    const projectIds = await getProjectIdsForRole(context);
    query.project = query.project || { $in: projectIds };
    return query;
  }

  if (context.role === ROLES.QA) {
    query.createdBy = ensureObjectId(context.userId, "userId");
    return query;
  }

  if (context.role === ROLES.DEVELOPER) {
    query.assignedDeveloper = ensureObjectId(context.userId, "userId");
    return query;
  }

  return { _id: { $in: [] } };
};

const verifyProjectAccess = async (projectId, context) => {
  const project = await Project.findById(projectId)
    .populate([
      { path: "manager", select: "name email role" },
      { path: "qaEngineers", select: "name email role" },
      { path: "developers", select: "name email role" },
    ])
    .lean();

  if (!project) {
    throw new Error("Project not found.");
  }

  if ([ROLES.ADMIN, ROLES.MANAGER].includes(context.role)) {
    return project;
  }

  if (
    context.role === ROLES.QA &&
    project.qaEngineers.some((user) => String(user._id) === String(context.userId))
  ) {
    return project;
  }

  if (
    context.role === ROLES.DEVELOPER &&
    project.developers.some((user) => String(user._id) === String(context.userId))
  ) {
    return project;
  }

  throw new Error("RBAC_DENIED: you do not have access to this project.");
};

const verifyBugAccess = async (bugId, context) => {
  const bug = await Bug.findById(bugId).populate(bugPopulate).lean();
  if (!bug) {
    throw new Error("Issue not found.");
  }

  if (context.role === ROLES.ADMIN) {
    return bug;
  }

  if (context.role === ROLES.MANAGER) {
    const accessibleProjectIds = await getProjectIdsForRole(context);
    if (accessibleProjectIds.some((id) => String(id) === String(bug.project?._id || bug.project))) {
      return bug;
    }
    throw new Error("RBAC_DENIED: manager cannot access this issue.");
  }

  if (context.role === ROLES.QA) {
    if (String(bug.createdBy?._id || bug.createdBy) === String(context.userId)) {
      return bug;
    }
    throw new Error("RBAC_DENIED: qa can only access issues they created.");
  }

  if (context.role === ROLES.DEVELOPER) {
    if (String(bug.assignedDeveloper?._id || bug.assignedDeveloper) === String(context.userId)) {
      return bug;
    }
    throw new Error("RBAC_DENIED: developer can only access assigned issues.");
  }

  throw new Error("RBAC_DENIED: issue access denied.");
};

const validateDeveloperAssignment = async (project, developerUserId) => {
  const developer = await User.findById(developerUserId).select("name role").lean();
  if (!developer) {
    throw new Error("Developer user not found.");
  }

  if (developer.role !== ROLES.DEVELOPER) {
    throw new Error("Selected assignee must have the developer role.");
  }

  const developerIds = (project.developers || []).map((entry) => String(entry._id || entry));
  if (!developerIds.includes(String(developer._id))) {
    throw new Error("Developer must already belong to the selected project.");
  }

  return developer;
};

const validateStatusChange = (bug, nextStatus, context) => {
  const allowedStatuses = BUG_STATUS[bug.type] || [];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new Error(`Status "${nextStatus}" is not valid for a ${bug.type}.`);
  }

  const flow =
    bug.type === BUG_TYPES.FEATURE
      ? ["new", "started", "completed"]
      : ["new", "started", "resolved"];

  if (nextStatus === "reopened" && [ROLES.ADMIN, ROLES.QA].includes(context.role)) {
    return;
  }

  const currentIndex = flow.indexOf(bug.status);
  const nextIndex = flow.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1 || nextIndex < currentIndex || nextIndex > currentIndex + 1) {
    throw new Error(`Invalid status transition from ${bug.status} to ${nextStatus}.`);
  }
};

const updateSessionEntities = async (context, patch = {}) => {
  if (!context.session) {
    return;
  }

  context.session.entities = {
    ...(context.session.entities || {}),
    ...patch,
  };
  await context.session.save();
};

const writeNotification = async ({ recipientId, bugId, assignedBy }) => {
  await mongoose.connection.collection("notifications").insertOne({
    recipientId: ensureObjectId(recipientId, "recipientId"),
    type: "bug_assigned",
    bugId: ensureObjectId(bugId, "bugId"),
    assignedBy: ensureObjectId(assignedBy, "assignedBy"),
    createdAt: new Date(),
    read: false,
  });
};

const logAudit = async ({
  context,
  toolName,
  toolInput,
  toolOutput,
  success = true,
  errorMessage = null,
  latencyMs = 0,
  tokensUsed = 0,
}) => {
  try {
    await AuditLog.create({
      userId: ensureObjectId(context.userId, "userId"),
      sessionId: context.session?.sessionId || null,
      toolName,
      toolInput,
      toolOutput,
      success,
      errorMessage,
      latencyMs,
      tokensUsed,
      ipAddress: context.requestMeta?.ipAddress || null,
      userAgent: context.requestMeta?.userAgent || null,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to write tool audit log.", {
      toolName,
      error: error.message,
    });
  }
};

const buildToolRunner = (context, tracker, toolName, resolver) => async (input = {}) => {
  const startedAt = Date.now();
  tracker?.toolsUsed?.add(toolName);
  tracker?.onToolStart?.(toolName);

  try {
    const result = await resolver(input);
    const response = {
      cached: Boolean(result.cached),
      latencyMs: Date.now() - startedAt,
      data: result.data,
    };
    const output = limitSerializedResult(response);
    if (tracker) {
      tracker.lastToolResult = { toolName, result: response };
    }
    tracker?.onToolEnd?.(toolName, extractResultCount(response), response.latencyMs);
    await logAudit({
      context,
      toolName,
      toolInput: input,
      toolOutput: output,
      latencyMs: response.latencyMs,
    });
    return output;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    tracker?.onToolEnd?.(toolName, 0, latencyMs);
    await logAudit({
      context,
      toolName,
      toolInput: input,
      toolOutput: null,
      success: false,
      errorMessage: error.message,
      latencyMs,
    });
    throw error;
  }
};

const createAgentTools = (context, tracker = {}) => {
  const requestCache = new Map();
  const remember = async (key, factory) => {
    if (!requestCache.has(key)) {
      requestCache.set(key, await factory());
    }
    return requestCache.get(key);
  };

  return [
    new DynamicStructuredTool({
      name: "get_my_projects",
      description: "Fetch all projects the current user is assigned to or allowed to view.",
      schema: z.object({
        includeStats: z.boolean().optional(),
      }),
      func: buildToolRunner(context, tracker, "get_my_projects", async ({ includeStats = false }) => {
        const cacheKey = `${context.userId}:projects:${includeStats}`;
        const cached = remember(cacheKey, async () => {
          const projects = await Project.find(getVisibleProjectScopeQuery(context))
            .populate([
              { path: "manager", select: "name email role" },
              { path: "qaEngineers", select: "name email role" },
              { path: "developers", select: "name email role" },
            ])
            .sort({ title: 1 })
            .lean();

          if (!includeStats || !projects.length) {
            return projects;
          }

          const bugCounts = await Bug.aggregate([
            { $match: { project: { $in: projects.map((project) => project._id) } } },
            { $group: { _id: "$project", bugCount: { $sum: 1 } } },
          ]);
          const bugCountMap = new Map(bugCounts.map((item) => [String(item._id), item.bugCount]));

          return projects.map((project) => ({
            ...project,
            bugCount: bugCountMap.get(String(project._id)) || 0,
          }));
        });

        return { data: await cached, cached: false };
      }),
    }),
    new DynamicStructuredTool({
      name: "get_bugs",
      description: "Fetch bugs with optional project, status, type, assignee, overdue, limit, and sort filters.",
      schema: z.object({
        projectId: z.string().trim().optional(),
        status: z.enum(["new", "started", "resolved", "completed", "reopened"]).optional(),
        type: z.enum([BUG_TYPES.BUG, BUG_TYPES.FEATURE]).optional(),
        assignedTo: z.string().trim().optional(),
        overdueOnly: z.boolean().optional(),
        limit: z.number().min(1).max(50).optional().default(DEFAULT_LIMIT),
        sortBy: z.enum(["createdAt", "deadline", "status"]).optional().default("createdAt"),
      }),
      func: buildToolRunner(
        context,
        tracker,
        "get_bugs",
        async ({ projectId, status, type, assignedTo, overdueOnly = false, limit = DEFAULT_LIMIT, sortBy = "createdAt" }) => {
          const filters = {};
          if (projectId) {
            filters.project = ensureObjectId(projectId, "projectId");
          }
          if (status) {
            filters.status = status;
          }
          if (type) {
            filters.type = type;
          }
          if (assignedTo) {
            filters.assignedDeveloper = ensureObjectId(assignedTo, "assignedTo");
          }
          if (overdueOnly) {
            filters.deadline = { $lt: new Date() };
            filters.status = { $nin: ["resolved", "completed"] };
          }

          const query = await buildBugScopeQuery(context, filters);
          const sort = sortBy === "deadline" ? { deadline: 1, createdAt: -1 } : { [sortBy]: -1, createdAt: -1 };

          const bugs = await Bug.find(query)
            .populate([
              { path: "project", select: "title" },
              { path: "assignedDeveloper", select: "name email role" },
              { path: "createdBy", select: "name email role" },
            ])
            .sort(sort)
            .limit(limit)
            .lean();

          const data = bugs.map((bug) => ({
            _id: bug._id,
            title: bug.title,
            type: bug.type,
            status: bug.status,
            project: bug.project,
            description: bug.description,
            deadline: bug.deadline,
            assignedDeveloper: bug.assignedDeveloper,
            createdBy: bug.createdBy,
            createdAt: bug.createdAt,
            updatedAt: bug.updatedAt,
          }));

          if (data[0]?._id) {
            await updateSessionEntities(context, { lastMentionedBugId: String(data[0]._id) });
          }

          return { data, cached: false };
        },
      ),
    }),
    new DynamicStructuredTool({
      name: "get_bug_detail",
      description: "Get full detail for a specific bug by ID.",
      schema: z.object({
        bugId: z.string().trim().min(1),
      }),
      func: buildToolRunner(context, tracker, "get_bug_detail", async ({ bugId }) => {
        const bug = await verifyBugAccess(ensureObjectId(bugId, "bugId"), context);
        await updateSessionEntities(context, {
          lastMentionedBugId: String(bug._id),
          lastMentionedProjectId: String(bug.project?._id || bug.project),
          lastMentionedUserId: bug.assignedDeveloper?._id ? String(bug.assignedDeveloper._id) : null,
        });
        return { data: bug, cached: false };
      }),
    }),
    new DynamicStructuredTool({
      name: "create_bug",
      description: "Create a new bug or feature request.",
      schema: z.object({
        title: z.string().trim().min(3),
        type: z.enum([BUG_TYPES.BUG, BUG_TYPES.FEATURE]),
        projectId: z.string().trim().min(1),
        description: z.string().trim().optional(),
        deadline: z.string().trim().optional(),
        assignedToUserId: z.string().trim().optional(),
      }),
      func: buildToolRunner(
        context,
        tracker,
        "create_bug",
        async ({ title, type, projectId, description, deadline, assignedToUserId }) => {
          if (![ROLES.ADMIN, ROLES.QA].includes(context.role)) {
            throw new Error("RBAC_DENIED: developer cannot create bugs.");
          }

          const project = await verifyProjectAccess(ensureObjectId(projectId, "projectId"), context);
          let assignee = null;
          if (assignedToUserId) {
            const developer = await validateDeveloperAssignment(project, ensureObjectId(assignedToUserId, "assignedToUserId"));
            assignee = developer._id;
          }

          const bug = await Bug.create({
            title,
            type,
            status: "new",
            project: ensureObjectId(projectId, "projectId"),
            description: description || "",
            deadline: deadline ? new Date(deadline) : null,
            assignedDeveloper: assignee,
            createdBy: ensureObjectId(context.userId, "userId"),
            activity: [
              {
                actor: ensureObjectId(context.userId, "userId"),
                action: "created",
                message: `${context.name} created this ${type}.`,
              },
            ],
          });

          const createdBug = await Bug.findById(bug._id).populate(bugPopulate).lean();
          await updateSessionEntities(context, {
            lastMentionedBugId: String(createdBug._id),
            lastMentionedProjectId: String(createdBug.project?._id || createdBug.project),
          });
          agentCache.flushAll();

          return {
            data: {
              message: "Issue created successfully.",
              bug: createdBug,
            },
            cached: false,
          };
        },
      ),
    }),
    new DynamicStructuredTool({
      name: "update_bug_status",
      description: "Update the status of a bug while enforcing valid transitions.",
      schema: z.object({
        bugId: z.string().trim().min(1),
        newStatus: z.string().trim().min(1),
      }),
      func: buildToolRunner(context, tracker, "update_bug_status", async ({ bugId, newStatus }) => {
        const bugIdValue = ensureObjectId(bugId, "bugId");
        const bug = await Bug.findById(bugIdValue).populate(bugPopulate);
        if (!bug) {
          throw new Error("Issue not found.");
        }

        const visibleBug = await verifyBugAccess(bugIdValue, context);
        if (!visibleBug) {
          throw new Error("RBAC_DENIED: issue access denied.");
        }

        validateStatusChange(bug.toObject(), newStatus, context);

        if (bug.status === newStatus) {
          return {
            data: {
              message: "Issue already has the requested status.",
              bug: visibleBug,
            },
            cached: false,
          };
        }

        const previousStatus = bug.status;
        bug.status = newStatus;
        bug.activity.push({
          actor: ensureObjectId(context.userId, "userId"),
          action: "status_changed",
          message: `${context.name} changed status from ${previousStatus} to ${newStatus}.`,
        });
        await bug.save();

        const updatedBug = await Bug.findById(bug._id).populate(bugPopulate).lean();
        await updateSessionEntities(context, {
          lastMentionedBugId: String(updatedBug._id),
          lastMentionedProjectId: String(updatedBug.project?._id || updatedBug.project),
        });
        agentCache.flushAll();

        return {
          data: {
            message: "Issue status updated successfully.",
            bug: updatedBug,
          },
          cached: false,
        };
      }),
    }),
    new DynamicStructuredTool({
      name: "assign_bug",
      description: "Assign a bug to a developer in the bug's project.",
      schema: z.object({
        bugId: z.string().trim().min(1),
        developerUserId: z.string().trim().min(1),
      }),
      func: buildToolRunner(context, tracker, "assign_bug", async ({ bugId, developerUserId }) => {
        if (![ROLES.ADMIN, ROLES.MANAGER].includes(context.role)) {
          throw new Error("RBAC_DENIED: only admin or manager can assign bugs.");
        }

        const bugIdValue = ensureObjectId(bugId, "bugId");
        const developerUserIdValue = ensureObjectId(developerUserId, "developerUserId");
        const bug = await Bug.findById(bugIdValue).populate(bugPopulate);
        if (!bug) {
          throw new Error("Issue not found.");
        }

        await verifyBugAccess(bugIdValue, context);
        const project = await Project.findById(bug.project?._id || bug.project)
          .populate([{ path: "developers", select: "name email role" }])
          .lean();
        const developer = await validateDeveloperAssignment(project, developerUserIdValue);

        bug.assignedDeveloper = developer._id;
        bug.activity.push({
          actor: ensureObjectId(context.userId, "userId"),
          action: "assignee_changed",
          message: `${context.name} assigned this issue to ${developer.name}.`,
        });
        await bug.save();

        await writeNotification({
          recipientId: developer._id,
          bugId: bug._id,
          assignedBy: context.userId,
        });

        const updatedBug = await Bug.findById(bug._id).populate(bugPopulate).lean();
        await updateSessionEntities(context, {
          lastMentionedBugId: String(updatedBug._id),
          lastMentionedProjectId: String(updatedBug.project?._id || updatedBug.project),
          lastMentionedUserId: String(developer._id),
        });
        agentCache.flushAll();

        return {
          data: {
            message: "Issue assigned successfully.",
            bug: updatedBug,
          },
          cached: false,
        };
      }),
    }),
    new DynamicStructuredTool({
      name: "get_dashboard_stats",
      description: "Return dashboard analytics within the current user's scope.",
      schema: z.object({}),
      func: buildToolRunner(context, tracker, "get_dashboard_stats", async () => {
        const cacheKey = `${context.userId}:${context.role}:dashboard_stats`;
        const cachedValue = agentCache.get(cacheKey);
        if (cachedValue) {
          return { data: cachedValue, cached: true };
        }

        const bugQuery = await buildBugScopeQuery(context);
        const [statusAgg, projectAgg, typeAgg, myBugsAgg] = await Promise.all([
          Bug.aggregate([
            { $match: bugQuery },
            { $group: { _id: "$status", value: { $sum: 1 } } },
            { $project: { _id: 0, name: "$_id", value: 1 } },
            { $sort: { name: 1 } },
          ]),
          Bug.aggregate([
            { $match: bugQuery },
            { $group: { _id: "$project", value: { $sum: 1 } } },
            {
              $lookup: {
                from: "projects",
                localField: "_id",
                foreignField: "_id",
                as: "project",
              },
            },
            { $unwind: "$project" },
            { $project: { _id: 0, name: "$project.title", value: 1 } },
            { $sort: { value: -1, name: 1 } },
          ]),
          Bug.aggregate([
            { $match: bugQuery },
            { $group: { _id: "$type", value: { $sum: 1 } } },
            { $project: { _id: 0, name: "$_id", value: 1 } },
            { $sort: { name: 1 } },
          ]),
          context.role === ROLES.DEVELOPER
            ? Bug.countDocuments({
                assignedDeveloper: ensureObjectId(context.userId, "userId"),
                status: { $in: ["new", "started", "reopened"] },
              })
            : Promise.resolve(undefined),
        ]);

        const data = {
          statusDist: statusAgg,
          bugsPerProject: projectAgg,
          typeDist: typeAgg,
          ...(context.role === ROLES.DEVELOPER ? { myOpenBugs: myBugsAgg } : {}),
        };
        agentCache.set(cacheKey, data, 60);
        return { data, cached: false };
      }),
    }),
    new DynamicStructuredTool({
      name: "search_bugs",
      description: "Search bugs by text with MongoDB text search and regex fallback.",
      schema: z.object({
        query: z.string().trim().min(1),
        limit: z.number().min(1).max(20).optional().default(10),
      }),
      func: buildToolRunner(context, tracker, "search_bugs", async ({ query, limit = 10 }) => {
        await ensureBugTextIndex();
        const scopeQuery = await buildBugScopeQuery(context);
        const safeRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        let textMatches = [];
        try {
          textMatches = await Bug.find({
            ...scopeQuery,
            $text: { $search: query },
          })
            .populate([
              { path: "project", select: "title" },
              { path: "assignedDeveloper", select: "name email role" },
              { path: "createdBy", select: "name email role" },
            ])
            .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
            .select({ score: { $meta: "textScore" } })
            .limit(limit)
            .lean();
        } catch (_error) {
          textMatches = [];
        }

        let regexMatches = [];
        if (textMatches.length < 3) {
          regexMatches = await Bug.find({
            ...scopeQuery,
            $or: [{ title: safeRegex }, { description: safeRegex }],
          })
            .populate([
              { path: "project", select: "title" },
              { path: "assignedDeveloper", select: "name email role" },
              { path: "createdBy", select: "name email role" },
            ])
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();
        }

        const ranking = new Map();
        [...textMatches, ...regexMatches].forEach((bug) => {
          const key = String(bug._id);
          const current = ranking.get(key);
          const title = String(bug.title || "").toLowerCase();
          const description = String(bug.description || "").toLowerCase();
          const lowerQuery = query.toLowerCase();
          let score = 1;

          if (title === lowerQuery) {
            score = 4;
          } else if (title.includes(lowerQuery)) {
            score = 3;
          } else if (description.includes(lowerQuery)) {
            score = 2;
          }

          if (!current || current.score < score) {
            ranking.set(key, { score, bug });
          }
        });

        const data = [...ranking.values()]
          .sort((left, right) => right.score - left.score)
          .slice(0, limit)
          .map((entry) => entry.bug);

        if (data[0]?._id) {
          await updateSessionEntities(context, { lastMentionedBugId: String(data[0]._id) });
        }

        return { data, cached: false };
      }),
    }),
  ];
};

const executeToolByName = async (tools, toolName, input = {}) => {
  const tool = tools.find((entry) => entry.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const payload = await tool.func(input);
  return JSON.parse(payload);
};

module.exports = {
  createAgentTools,
  executeToolByName,
};
