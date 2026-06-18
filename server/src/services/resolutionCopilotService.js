const OpenAI = require("openai");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const { BUG_STATUS, BUG_TYPES } = require("../utils/constants");

const RESOLUTION_COPILOT_PROMPT = `You are a senior MERN stack software engineer.
A developer needs a specific fix plan for a bug.

MOST IMPORTANT RULE:
Read the bug details VERY carefully.
Every fix plan must be 100% specific to this exact bug.
NEVER give generic steps.
NEVER repeat same steps for different bugs.

HOW TO CREATE SPECIFIC FIX PLAN:

Step 1: Identify the EXACT feature from bug title
- "login" -> steps about authentication, JWT, login API
- "payment" -> steps about payment API, checkout, cart
- "upload" -> steps about multer, file handling, storage
- "dashboard" -> steps about data fetching, charts, rendering
- "register" -> steps about user creation, validation, bcrypt

Step 2: Identify the EXACT error type
- "not working" / "not responding" -> check event handlers, API calls
- "crash" / "freeze" -> check error boundaries, null checks, memory
- "not saving" / "not updating" -> check database queries, middleware
- "not showing" / "not displaying" -> check state, rendering, CSS
- "error 401" -> check JWT token, auth middleware, headers
- "error 500" -> check server logs, database connection, validation
- "error 404" -> check routes, API endpoint URLs
- "slow" -> check database indexes, query optimization

Step 3: Write SPECIFIC numbered steps for THAT exact bug

RULES:
- Minimum 4 steps, maximum 6 steps
- Each step must mention SPECIFIC file names
- Each step must mention SPECIFIC function names
- Each step must have SPECIFIC technical detail
- NEVER write generic steps like "Check the code"
- NEVER write "Test the feature" without specifics
- Each step tool must match the action

STRICT RULES:
- Return ONLY valid JSON
- No markdown, no backticks, no explanation
- No text before or after JSON
- Code must be real JavaScript or JSX
- File names must be realistic MERN stack files
- Be specific to the exact bug described
- Never give generic answers

Return this EXACT JSON structure:
{
  "rootCause": {
    "summary": "one clear sentence about root cause",
    "details": "2-3 sentences with technical explanation",
    "confidence": "high" or "medium" or "low"
  },
  "affectedFiles": [
    {
      "filename": "ExactFileName.js",
      "location": "backend/controllers/",
      "reason": "specific reason why this file",
      "priority": "check_first" or "check_second" or "check_if_needed"
    }
  ],
  "codeFixes": [
    {
      "title": "descriptive fix title",
      "language": "javascript" or "jsx",
      "description": "what problem this fix solves",
      "code": "real working code snippet",
      "applyIn": "exact filename"
    }
  ],
  "fixPlan": [
    {
      "step": 1,
      "action": "specific action to take",
      "detail": "technical detail of how to do it",
      "tool": "VS Code" or "Postman" or "Browser DevTools" or "MongoDB Compass" or "Terminal"
    }
  ],
  "statusSuggestion": {
    "currentStatus": "new" or "started" or "resolved" or "completed" or "reopened",
    "suggestedStatus": "started" or "resolved" or "completed",
    "reason": "clear reason for this suggestion",
    "updateNow": true or false
  },
  "severityScore": {
    "score": number between 0 and 100,
    "label": "Critical" or "High" or "Medium" or "Low",
    "breakdown": {
      "impact": number 1-10,
      "frequency": number 1-10,
      "complexity": number 1-10
    }
  },
  "estimatedTime": {
    "minutes": 30,
    "complexity": "simple" or "moderate" or "complex",
    "explanation": "why this complexity level"
  },
  "warnings": [
    "important warning if any"
  ]
}

Severity score guide:
- Critical (80-100): login broken, data loss, payment broken, security issue, app crash
- High (60-79): major feature not working or many users affected
- Medium (40-59): partial functionality broken or workaround exists
- Low (0-39): minor UI/cosmetic issue`;

const extractJson = (text = "") => {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```javascript/g, "")
    .replace(/```jsx/g, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new ApiError(502, "AI returned invalid Copilot response.");
  }
  return JSON.parse(match[0]);
};

const bugContext = (bug) =>
  `
Bug Title: ${bug.title}
Bug Type: ${bug.type}
Priority: ${bug.priority || "Medium"}
Current Status: ${bug.status}
Description: ${bug.description || "Not provided"}
Steps to Reproduce: ${bug.stepsToReproduce || "Not provided"}
Expected Result: ${bug.expectedResult || "Not provided"}
Actual Result: ${bug.actualResult || "Not provided"}
Project: ${bug.project?.title || "Unknown"}
Assigned Developer: ${bug.assignedDeveloper?.name || "Unassigned"}
Reporter: ${bug.createdBy?.name || "Unknown"}
  `.trim();

const textIncludes = (bug, keywords) => {
  const text = `${bug.title} ${bug.description} ${bug.stepsToReproduce} ${bug.actualResult}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
};

const inferArea = (bug) => {
  if (textIncludes(bug, ["login", "auth", "401", "session"])) return "authentication flow";
  if (textIncludes(bug, ["payment", "membership", "invoice"])) return "payment and membership flow";
  if (textIncludes(bug, ["save", "database", "record"])) return "database write flow";
  if (textIncludes(bug, ["upload", "screenshot", "file"])) return "file upload flow";
  if (textIncludes(bug, ["dashboard", "chart", "count", "stats"])) return "dashboard data flow";
  if (textIncludes(bug, ["button", "click", "modal", "form"])) return "frontend form interaction";
  return "reported feature flow";
};

const inferFiles = (bug) => {
  const files = [
    {
      filename: "BugsPage.jsx",
      location: "client/src/pages/",
      reason: "This page renders issue lists, filters, Kanban cards, and opens the detail drawer where the bug behavior is visible.",
      priority: "check_first",
    },
    {
      filename: "bugController.js",
      location: "server/src/controllers/",
      reason: "Backend create/update/read behavior for bugs is handled here, so request payload and status persistence should be checked.",
      priority: "check_second",
    },
  ];

  if (textIncludes(bug, ["login", "auth", "401", "session"])) {
    files.unshift({
      filename: "authController.js",
      location: "server/src/controllers/",
      reason: "Authentication or 401 errors usually originate from token validation, login response, or refresh handling.",
      priority: "check_first",
    });
  }

  if (textIncludes(bug, ["save", "database", "record", "assigned", "project"])) {
    files.push({
      filename: "Bug.js",
      location: "server/src/models/",
      reason: "Schema fields and references should match the payload being saved to MongoDB.",
      priority: "check_if_needed",
    });
  }

  if (textIncludes(bug, ["form", "modal", "button", "upload", "deadline", "assignee"])) {
    files.push({
      filename: "BugModal.jsx",
      location: "client/src/components/modals/",
      reason: "The create/edit issue form owns most form inputs and submit payload building.",
      priority: "check_if_needed",
    });
  }

  return files.slice(0, 5);
};

const localFixPlanFor = (bug) => {
  if (textIncludes(bug, ["login", "auth", "401", "session"])) {
    return [
      {
        step: 1,
        action: "Test login API endpoint with the reported credentials",
        detail: "Send POST /api/auth/login from Postman with the same email/password. Confirm whether authController.login returns 401 and read the exact response message.",
        tool: "Postman",
      },
      {
        step: 2,
        action: "Check token creation inside authController.js",
        detail: "Open server/src/controllers/authController.js and inspect the login function. Verify access/refresh tokens are generated with tokenService and the returned user payload contains the expected id and role.",
        tool: "VS Code",
      },
      {
        step: 3,
        action: "Verify password comparison and user lookup",
        detail: "In authController.login, confirm the email query finds the correct User document and bcrypt.compare receives the plain request password and stored hashed password.",
        tool: "VS Code",
      },
      {
        step: 4,
        action: "Inspect auth middleware header parsing",
        detail: "Open server/src/middleware/auth.js and confirm it reads Authorization: Bearer <token>. If the request is missing the header, trace client/src/api/axios.js request interceptor.",
        tool: "VS Code",
      },
      {
        step: 5,
        action: "Reproduce login in browser Network tab",
        detail: "Open DevTools Network, click the login button, inspect /api/auth/login request payload, response status, Set-Cookie header, and accessToken saved in localStorage.",
        tool: "Browser DevTools",
      },
    ];
  }

  if (textIncludes(bug, ["payment", "membership", "invoice", "checkout", "cart"])) {
    return [
      {
        step: 1,
        action: "Capture the payment failure in browser console",
        detail: "Open the payment or membership screen, perform the checkout action, and note the exact console error plus the failing request URL from DevTools Network.",
        tool: "Browser DevTools",
      },
      {
        step: 2,
        action: "Inspect payment submit handler in the React page",
        detail: "Find the checkout/payment component and check its handleSubmit or handlePayment function. Verify amount, userId, membershipId, and paymentStatus are not undefined before the API call.",
        tool: "VS Code",
      },
      {
        step: 3,
        action: "Test payment API with the same payload",
        detail: "Use Postman to send the exact request body to the payment route. If it returns 500, compare the response with required fields in the payment or membership model.",
        tool: "Postman",
      },
      {
        step: 4,
        action: "Check backend payment controller persistence",
        detail: "Open the payment/membership controller and verify the create/update function saves both payment record and membership activation status in one consistent flow.",
        tool: "VS Code",
      },
      {
        step: 5,
        action: "Verify saved payment data in MongoDB",
        detail: "Open MongoDB Compass and confirm the payment document exists and the related user membership status is updated after successful checkout.",
        tool: "MongoDB Compass",
      },
    ];
  }

  if (textIncludes(bug, ["upload", "profile picture", "screenshot", "file", "image", "png", "gif"])) {
    return [
      {
        step: 1,
        action: "Inspect upload request in Network tab",
        detail: "Select the same image file and click upload. Confirm the request Content-Type is multipart/form-data and the file field name matches the backend multer field.",
        tool: "Browser DevTools",
      },
      {
        step: 2,
        action: "Verify multer route middleware",
        detail: "Open the route file handling this upload and confirm upload.single(\"screenshot\") or the correct field middleware runs before the controller function.",
        tool: "VS Code",
      },
      {
        step: 3,
        action: "Check upload validation rules",
        detail: "Inspect multer fileFilter and size limits. Confirm image/png and image/gif MIME types are allowed and rejected files return a clear validation error.",
        tool: "VS Code",
      },
      {
        step: 4,
        action: "Test the upload endpoint directly",
        detail: "In Postman choose form-data, attach an image file under the exact backend field name, and verify the API returns the stored file URL.",
        tool: "Postman",
      },
      {
        step: 5,
        action: "Check uploads folder and saved path",
        detail: "Verify server/src/uploads or the configured upload directory exists, then confirm the database stores the same relative path returned to the frontend.",
        tool: "Terminal",
      },
    ];
  }

  if (textIncludes(bug, ["dashboard", "chart", "count", "stats", "graph", "total", "resolved today"])) {
    return [
      {
        step: 1,
        action: "Inspect dashboard API response",
        detail: "Open DevTools Network and reload the dashboard. Check GET /api/dashboard response to confirm counts, chart arrays, and resolvedToday values are returned.",
        tool: "Browser DevTools",
      },
      {
        step: 2,
        action: "Check dashboardController aggregation",
        detail: "Open server/src/controllers/dashboardController.js and inspect the function that builds stats. Verify it filters by role/project correctly and uses today's date range for resolved issues.",
        tool: "VS Code",
      },
      {
        step: 3,
        action: "Validate bug status data in MongoDB",
        detail: "Open MongoDB Compass and query bugs with status resolved/completed. Confirm updatedAt or activity timestamps fall inside today's start/end range.",
        tool: "MongoDB Compass",
      },
      {
        step: 4,
        action: "Trace frontend stat mapping",
        detail: "Open client/src/pages/DashboardPage.jsx and confirm the API fields are mapped to the correct cards and charts without defaulting real values to zero.",
        tool: "VS Code",
      },
      {
        step: 5,
        action: "Retest chart rendering after data load",
        detail: "Add a temporary console.log for dashboard payload before chart render and ensure Recharts receives non-empty labels and numeric values.",
        tool: "Browser DevTools",
      },
    ];
  }

  if (textIncludes(bug, ["save", "saving", "database", "record", "not updating", "not saving"])) {
    return [
      {
        step: 1,
        action: "Check the save request payload",
        detail: "Open DevTools Network, perform the save action, and inspect whether title, project, status, assignedDeveloper, deadline, and description are present in the request.",
        tool: "Browser DevTools",
      },
      {
        step: 2,
        action: "Verify submit handler field names",
        detail: "Open BugModal.jsx or the affected form component and confirm FormData keys match Bug.js schema fields such as assignedDeveloper, deadline, and description.",
        tool: "VS Code",
      },
      {
        step: 3,
        action: "Inspect backend validation and controller save logic",
        detail: "Open server/src/controllers/bugController.js and validateBugInput. Confirm createBug/updateBug accepts the same fields and does not overwrite them with empty defaults.",
        tool: "VS Code",
      },
      {
        step: 4,
        action: "Check Bug schema required fields",
        detail: "Open server/src/models/Bug.js and verify the field type/default matches the payload. Pay special attention to ObjectId references and enum status values.",
        tool: "VS Code",
      },
      {
        step: 5,
        action: "Confirm saved document in MongoDB",
        detail: "Use MongoDB Compass to open the bug document after saving and confirm the field changed in the database, not only in frontend state.",
        tool: "MongoDB Compass",
      },
    ];
  }

  return [
    {
      step: 1,
      action: `Reproduce the ${inferArea(bug)} issue exactly`,
      detail: `Use the title "${bug.title}" and the report description to perform the same user action. Capture the failing request, console error, and screen behavior.`,
      tool: "Browser DevTools",
    },
    {
      step: 2,
      action: "Trace the matching frontend component",
      detail: `Search the client/src folder for text or route related to "${bug.title}". Inspect the event handler that triggers this exact behavior.`,
      tool: "VS Code",
    },
    {
      step: 3,
      action: "Validate the API endpoint used by that component",
      detail: "Copy the exact request URL and body from DevTools into Postman, then confirm whether the bug is frontend-only or backend/API related.",
      tool: "Postman",
    },
    {
      step: 4,
      action: "Inspect the related Express controller",
      detail: "Open the controller for the failing endpoint and verify validation, role checks, database query, and returned response shape match the frontend expectation.",
      tool: "VS Code",
    },
    {
      step: 5,
      action: "Verify database state for this specific issue",
      detail: "Use MongoDB Compass to confirm the records referenced by this bug exist and contain the fields the frontend expects to render.",
      tool: "MongoDB Compass",
    },
  ];
};

const suggestedStatusFor = (bug) => {
  const allowed = BUG_STATUS[bug.type] || BUG_STATUS[BUG_TYPES.BUG];
  if (["resolved", "completed"].includes(bug.status)) {
    return {
      currentStatus: bug.status,
      suggestedStatus: bug.status,
      reason: "This issue is already in a done state, so no status change is needed.",
      updateNow: false,
    };
  }

  if (bug.status === "new" && allowed.includes("started")) {
    return {
      currentStatus: bug.status,
      suggestedStatus: "started",
      reason: "The issue has enough detail for a developer to begin investigation.",
      updateNow: true,
    };
  }

  const doneStatus = bug.type === BUG_TYPES.FEATURE ? "completed" : "resolved";
  return {
    currentStatus: bug.status,
    suggestedStatus: allowed.includes(doneStatus) ? doneStatus : bug.status,
    reason: "After applying and testing the fix, this issue can be moved to the final workflow state.",
    updateNow: false,
  };
};

const normalizeStatusSuggestion = (raw, bug) => {
  const fallback = suggestedStatusFor(bug);
  const allowedStatuses = BUG_STATUS[bug.type] || BUG_STATUS[BUG_TYPES.BUG];
  const suggestedStatus = allowedStatuses.includes(raw?.suggestedStatus)
    ? raw.suggestedStatus
    : fallback.suggestedStatus;

  return {
    currentStatus: bug.status,
    suggestedStatus,
    reason: raw?.reason || fallback.reason,
    updateNow: Boolean(raw?.updateNow ?? fallback.updateNow) && suggestedStatus !== bug.status,
  };
};

const localSeverityScore = (bug) => {
  let impact = 5;
  let frequency = 5;
  let complexity = 5;

  if (bug.priority === "Critical" || textIncludes(bug, ["login", "auth", "payment", "data loss", "security", "crash"])) {
    impact = 9;
    frequency = 8;
    complexity = 7;
  } else if (bug.priority === "High" || textIncludes(bug, ["not working", "not saving", "error", "broken", "missing"])) {
    impact = 7;
    frequency = 7;
    complexity = 6;
  } else if (bug.priority === "Low" || textIncludes(bug, ["typo", "color", "spacing", "alignment", "cosmetic"])) {
    impact = 3;
    frequency = 3;
    complexity = 2;
  }

  const score = Math.round(((impact + frequency + complexity) / 30) * 100);
  const label = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low";
  return {
    score,
    label,
    breakdown: {
      impact,
      frequency,
      complexity,
    },
  };
};

const normalizeSeverityScore = (raw, bug) => {
  const fallback = localSeverityScore(bug);
  const score = Number(raw?.score);
  const impact = Number(raw?.breakdown?.impact);
  const frequency = Number(raw?.breakdown?.frequency);
  const complexity = Number(raw?.breakdown?.complexity);
  const normalizedScore = Number.isNaN(score) ? fallback.score : Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: normalizedScore,
    label: ["Critical", "High", "Medium", "Low"].includes(raw?.label)
      ? raw.label
      : normalizedScore >= 80
        ? "Critical"
        : normalizedScore >= 60
          ? "High"
          : normalizedScore >= 40
            ? "Medium"
            : "Low",
    breakdown: {
      impact: Number.isNaN(impact) ? fallback.breakdown.impact : Math.max(1, Math.min(10, Math.round(impact))),
      frequency: Number.isNaN(frequency) ? fallback.breakdown.frequency : Math.max(1, Math.min(10, Math.round(frequency))),
      complexity: Number.isNaN(complexity) ? fallback.breakdown.complexity : Math.max(1, Math.min(10, Math.round(complexity))),
    },
  };
};

const normalizeCopilot = (raw, bug) => ({
  rootCause: {
    summary: raw?.rootCause?.summary || `The likely issue is inside the ${inferArea(bug)}.`,
    details:
      raw?.rootCause?.details ||
      "Review the frontend payload, API response, and MongoDB persistence path for mismatched field names or missing validation.",
    confidence: ["high", "medium", "low"].includes(raw?.rootCause?.confidence) ? raw.rootCause.confidence : "medium",
  },
  affectedFiles: Array.isArray(raw?.affectedFiles) && raw.affectedFiles.length ? raw.affectedFiles : inferFiles(bug),
  codeFixes:
    Array.isArray(raw?.codeFixes) && raw.codeFixes.length
      ? raw.codeFixes
      : [
          {
            title: "Validate request payload before saving",
            language: "javascript",
            description: "Add a focused guard so missing fields are caught before the controller writes invalid data.",
            applyIn: "server/src/controllers/bugController.js",
            code: `if (!req.body.title || !req.body.project) {\n  throw new ApiError(400, "Title and project are required.");\n}`,
          },
          {
            title: "Confirm frontend sends the expected field names",
            language: "jsx",
            description: "Make sure the submit payload matches the backend schema names.",
            applyIn: "client/src/components/modals/BugModal.jsx",
            code: `formData.append("assignedDeveloper", selectedDeveloperId);\nformData.append("deadline", deadlineValue);\nformData.append("description", descriptionValue);`,
          },
        ],
  fixPlan:
    Array.isArray(raw?.fixPlan) && raw.fixPlan.length
      ? raw.fixPlan
      : localFixPlanFor(bug),
  statusSuggestion: normalizeStatusSuggestion(raw?.statusSuggestion, bug),
  severityScore: normalizeSeverityScore(raw?.severityScore, bug),
  estimatedTime: {
    minutes: Number(raw?.estimatedTime?.minutes) || (bug.priority === "Critical" ? 60 : 35),
    complexity: ["simple", "moderate", "complex"].includes(raw?.estimatedTime?.complexity)
      ? raw.estimatedTime.complexity
      : bug.priority === "Critical"
        ? "complex"
        : "moderate",
    explanation:
      raw?.estimatedTime?.explanation ||
      "Estimate is based on checking frontend payload, backend controller logic, and database persistence.",
  },
  warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
});

const buildLocalCopilot = (bug) =>
  normalizeCopilot(
    {
      rootCause: {
        summary: `The likely root cause is in the ${inferArea(bug)}.`,
        details:
          "The reported behavior suggests either the frontend is sending incomplete data, the backend is rejecting or ignoring a field, or the saved data is not being re-fetched correctly. Start by comparing the request payload with the Bug schema and controller update logic.",
        confidence: bug.description?.length > 30 ? "medium" : "low",
      },
      affectedFiles: inferFiles(bug),
      statusSuggestion: suggestedStatusFor(bug),
      warnings: bug.priority === "Critical" ? ["Critical bugs should be tested immediately after the fix is applied."] : [],
    },
    bug
  );

const generateResolutionCopilot = async (bug) => {
  if (!env.openAiApiKey) {
    return buildLocalCopilot(bug);
  }

  try {
    const client = new OpenAI({ apiKey: env.openAiApiKey });
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 1800,
      temperature: 0.7,
      messages: [
        { role: "system", content: RESOLUTION_COPILOT_PROMPT },
        {
          role: "user",
          content: `This is the specific bug to analyze:

${bugContext(bug)}

REMEMBER: Fix plan steps must be 100% specific to THIS exact bug.
Not generic. Not copied from other bugs.
Mention specific file names, function names, and technical details
that directly relate to: "${bug.title}"`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || "";
    return normalizeCopilot(extractJson(content), bug);
  } catch (error) {
    return buildLocalCopilot(bug);
  }
};

module.exports = {
  generateResolutionCopilot,
};
