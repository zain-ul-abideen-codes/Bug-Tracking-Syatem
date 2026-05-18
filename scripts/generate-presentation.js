const path = require("path");
const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();

pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "BugTracker Pro";
pptx.subject = "Final Year Project Presentation";
pptx.title = "BugTracker Pro - Final Year Project Presentation";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};

const colors = {
  navy: "132238",
  blue: "1F6FEB",
  sky: "DCEBFF",
  green: "2E7D32",
  orange: "ED6C02",
  red: "D32F2F",
  ink: "0F172A",
  gray: "475569",
  soft: "F5F8FC",
  white: "FFFFFF",
  border: "D9E2F0",
};

const teamRows = [
  ["Zain", "Authentication, authorization, user management, and secure backend access"],
  ["Huzaifa", "Projects, issues, Kanban workflow, assigned work, and dashboard analytics"],
  ["Sufiyan", "Frontend redesign, theme system, notifications, AI agent, and audit UI"],
];

function addSlideTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.7,
    y: 0.45,
    w: 8.6,
    h: 0.5,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: colors.ink,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.72,
      y: 0.95,
      w: 11.1,
      h: 0.4,
      fontFace: "Aptos",
      fontSize: 10.5,
      color: colors.gray,
    });
  }
}

function addTopBand(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.28,
    line: { color: colors.blue, transparency: 100 },
    fill: { color: colors.blue },
  });
}

function addBulletList(slide, items, options = {}) {
  const x = options.x ?? 0.9;
  const y = options.y ?? 1.55;
  const w = options.w ?? 5.4;
  const h = options.h ?? 4.8;
  const fontSize = options.fontSize ?? 17;
  const runs = [];

  items.forEach((item, index) => {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 14 },
        breakLine: index !== items.length - 1,
      },
    });
  });

  slide.addText(runs, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize,
    color: colors.ink,
    paraSpaceAfterPt: 10,
    valign: "top",
  });
}

function addInfoCard(slide, { x, y, w, h, title, body, accent = colors.blue }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: colors.border, pt: 1 },
    fill: { color: colors.white },
    shadow: { type: "outer", color: "AAB7C8", blur: 1, angle: 45, distance: 1, opacity: 0.15 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.35,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: colors.ink,
  });
  slide.addText(body, {
    x: x + 0.22,
    y: y + 0.56,
    w: w - 0.35,
    h: h - 0.7,
    fontSize: 10.5,
    color: colors.gray,
    valign: "top",
  });
}

function addFooter(slide, pageNumber) {
  slide.addText(`BugTracker Pro  |  FYP Presentation  |  Slide ${pageNumber}`, {
    x: 0.7,
    y: 7.08,
    w: 4.5,
    h: 0.18,
    fontSize: 8.5,
    color: colors.gray,
  });
}

function buildCover() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.soft };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    line: { color: colors.soft, transparency: 100 },
    fill: { color: colors.soft },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.05,
    line: { color: colors.navy, transparency: 100 },
    fill: { color: colors.navy },
  });
  slide.addText("BugTracker Pro", {
    x: 0.7,
    y: 1.35,
    w: 6.5,
    h: 0.55,
    fontSize: 28,
    bold: true,
    color: colors.ink,
    fontFace: "Aptos Display",
  });
  slide.addText("AI-Enhanced Role-Based MERN Bug Tracking System", {
    x: 0.72,
    y: 2.02,
    w: 7.2,
    h: 0.32,
    fontSize: 15,
    color: colors.gray,
  });
  slide.addText("Final Year Project Presentation", {
    x: 0.72,
    y: 2.55,
    w: 4.8,
    h: 0.24,
    fontSize: 12,
    bold: true,
    color: colors.blue,
  });

  addInfoCard(slide, {
    x: 0.72,
    y: 3.12,
    w: 4.1,
    h: 1.78,
    title: "Team Members",
    body: "Zain\nHuzaifa\nSufiyan",
    accent: colors.blue,
  });

  addInfoCard(slide, {
    x: 5.1,
    y: 3.12,
    w: 3.4,
    h: 1.78,
    title: "Tech Stack",
    body: "React, Vite, Material UI\nNode.js, Express.js\nMongoDB, Mongoose\nJWT, LangChain, OpenAI",
    accent: colors.green,
  });

  addInfoCard(slide, {
    x: 8.78,
    y: 3.12,
    w: 3.8,
    h: 1.78,
    title: "Target Users",
    body: "Administrator\nManager\nQA Engineer\nDeveloper",
    accent: colors.orange,
  });

  slide.addText("Department of Computer Science", {
    x: 0.72,
    y: 6.42,
    w: 4.2,
    h: 0.2,
    fontSize: 10,
    color: colors.gray,
  });
  slide.addText("Session: 2026 Viva / Demonstration", {
    x: 0.72,
    y: 6.68,
    w: 4.6,
    h: 0.2,
    fontSize: 10,
    color: colors.gray,
  });
  addFooter(slide, 1);
}

function buildProblemSolution() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "Problem Statement and Solution", "Why this project was needed and how BugTracker Pro solves the workflow gap.");
  addInfoCard(slide, {
    x: 0.72,
    y: 1.55,
    w: 5.9,
    h: 4.85,
    title: "Problem",
    body: "Software teams often struggle with scattered issue reporting, unclear project ownership, weak role-based visibility, and poor tracking of bug progress. Manual follow-up also slows down communication between QA, developers, and managers.",
    accent: colors.red,
  });
  addInfoCard(slide, {
    x: 6.85,
    y: 1.55,
    w: 5.75,
    h: 4.85,
    title: "Solution",
    body: "BugTracker Pro centralizes projects, issues, dashboards, and AI-assisted queries into one system. It provides secure login, role-based access, project assignments, issue workflow management, analytics, screenshot uploads, and a built-in AI assistant with audit tracking.",
    accent: colors.green,
  });
  addFooter(slide, 2);
}

function buildObjectives() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "Project Objectives", "Key goals delivered by the final year project.");
  addBulletList(slide, [
    "Build a secure role-based bug tracking platform for software teams.",
    "Provide project assignment and issue workflow management in one place.",
    "Support bug and feature tracking with comments, screenshots, and status updates.",
    "Offer role-aware dashboards for better visibility and decision-making.",
    "Embed an AI assistant for faster project and issue lookup.",
    "Maintain transparency through AI audit logs and access control.",
  ], { x: 0.9, y: 1.6, w: 11.2, h: 4.6, fontSize: 18 });
  addFooter(slide, 3);
}

function buildModules() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.soft };
  addTopBand(slide);
  addSlideTitle(slide, "Core Modules", "The main functional areas of the application.");
  const cards = [
    ["Authentication & Sessions", "JWT access and refresh tokens, secure login, logout, and protected routing.", colors.blue],
    ["Users & Roles", "Admin user management, password reset, role-based access, and controlled visibility.", colors.orange],
    ["Projects", "Create projects, assign manager/QA/developers, and view project details.", colors.green],
    ["Issues", "Bug and feature tracking, comments, screenshots, deadlines, table view, and Kanban workflow.", colors.red],
    ["Dashboard", "Role-aware metrics, status charts, creation trends, and recent activity feed.", colors.blue],
    ["AI Agent & Audit", "Streaming BugBot, quick tool-based answers, and admin audit trail for AI actions.", colors.orange],
  ];
  let x = 0.72;
  let y = 1.55;
  cards.forEach((card, index) => {
    addInfoCard(slide, {
      x,
      y,
      w: 3.95,
      h: 1.55,
      title: card[0],
      body: card[1],
      accent: card[2],
    });
    x += 4.18;
    if ((index + 1) % 3 === 0) {
      x = 0.72;
      y += 1.82;
    }
  });
  addFooter(slide, 4);
}

function buildRoles() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "Role-Based Access", "Each role has a specific scope and responsibility inside the platform.");
  addInfoCard(slide, {
    x: 0.72, y: 1.55, w: 3.0, h: 2.1,
    title: "Administrator",
    body: "Full system access. Manages users, projects, issues, dashboards, AI agent, and AI audit data.",
    accent: colors.blue,
  });
  addInfoCard(slide, {
    x: 3.97, y: 1.55, w: 3.0, h: 2.1,
    title: "Manager",
    body: "Creates and manages projects, assigns QA and developers, and monitors project analytics.",
    accent: colors.green,
  });
  addInfoCard(slide, {
    x: 7.22, y: 1.55, w: 2.9, h: 2.1,
    title: "QA Engineer",
    body: "Creates bugs and features, edits own issues, reopens issues, and tracks assigned projects.",
    accent: colors.orange,
  });
  addInfoCard(slide, {
    x: 10.37, y: 1.55, w: 2.25, h: 2.1,
    title: "Developer",
    body: "Views assigned issues and updates only the status of assigned work.",
    accent: colors.red,
  });
  addBulletList(slide, [
    "Frontend navigation is role-aware.",
    "Backend routes are protected with authentication and authorization middleware.",
    "Project and issue visibility changes according to the current logged-in role.",
  ], { x: 0.95, y: 4.25, w: 11.0, h: 1.8, fontSize: 17 });
  addFooter(slide, 5);
}

function buildWorkflow() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "Issue Workflow and Kanban Flow", "How bugs and features move through the system.");
  addInfoCard(slide, {
    x: 0.78, y: 1.6, w: 2.35, h: 1.3,
    title: "Step 1",
    body: "QA or Admin creates a bug or feature request and attaches project details.",
    accent: colors.blue,
  });
  addInfoCard(slide, {
    x: 3.35, y: 1.6, w: 2.35, h: 1.3,
    title: "Step 2",
    body: "Issue is assigned to a developer from the selected project team.",
    accent: colors.orange,
  });
  addInfoCard(slide, {
    x: 5.92, y: 1.6, w: 2.35, h: 1.3,
    title: "Step 3",
    body: "Developer updates issue status in table view or through drag-and-drop Kanban.",
    accent: colors.green,
  });
  addInfoCard(slide, {
    x: 8.49, y: 1.6, w: 2.35, h: 1.3,
    title: "Step 4",
    body: "QA verifies the fix and reopens the issue if the problem still exists.",
    accent: colors.red,
  });
  addInfoCard(slide, {
    x: 11.06, y: 1.6, w: 1.6, h: 1.3,
    title: "Step 5",
    body: "Dashboard reflects project progress and issue state changes.",
    accent: colors.blue,
  });
  addBulletList(slide, [
    "Bug statuses: new, started, resolved, reopened",
    "Feature statuses: new, started, completed, reopened",
    "Kanban board supports premium lane visuals and drag-based status movement",
  ], { x: 0.92, y: 3.5, w: 11.3, h: 1.8, fontSize: 17 });
  addFooter(slide, 6);
}

function buildDashboard() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.soft };
  addTopBand(slide);
  addSlideTitle(slide, "Dashboard and Analytics", "Role-aware metrics and charts for quick monitoring.");
  const items = [
    ["Total Bugs", "Shows total visible issues in the current role scope."],
    ["Total Projects", "Counts visible projects assigned to the role."],
    ["Open Issues", "Tracks pending work including new, started, and reopened items."],
    ["Resolved Today", "Counts issues resolved or completed today inside the current role scope."],
    ["Bug Status Distribution", "Pie chart for workflow status balance."],
    ["Issue Creation Trend", "7-day and 30-day view of newly created issues."],
  ];
  let x = 0.72;
  let y = 1.55;
  items.forEach((item, index) => {
    addInfoCard(slide, {
      x,
      y,
      w: 3.95,
      h: 1.45,
      title: item[0],
      body: item[1],
      accent: index % 2 === 0 ? colors.blue : colors.green,
    });
    x += 4.18;
    if ((index + 1) % 3 === 0) {
      x = 0.72;
      y += 1.75;
    }
  });
  addFooter(slide, 7);
}

function buildAI() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "AI Agent and AI Audit", "How BugBot extends the platform beyond a traditional bug tracker.");
  addInfoCard(slide, {
    x: 0.72,
    y: 1.55,
    w: 5.8,
    h: 4.85,
    title: "BugBot AI Agent",
    body: "The embedded AI assistant can answer project and issue questions, stream responses in real time, suggest next actions, and respect role-based access control. It uses quick intent detection, tool-based reads, and cached responses for speed.",
    accent: colors.blue,
  });
  addInfoCard(slide, {
    x: 6.78,
    y: 1.55,
    w: 5.8,
    h: 4.85,
    title: "AI Audit Trail",
    body: "Administrators can inspect AI activity through BugBot Audit Trail, including actions, users, latency, status, and failures. This improves transparency, monitoring, and trust for AI-assisted operations.",
    accent: colors.orange,
  });
  addFooter(slide, 8);
}

function buildArchitecture() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "System Architecture", "High-level view of the MERN stack implementation.");
  addInfoCard(slide, {
    x: 0.72, y: 1.7, w: 2.45, h: 2.0,
    title: "Frontend",
    body: "React + Vite\nMaterial UI\nReact Router\nAxios\nRecharts",
    accent: colors.blue,
  });
  addInfoCard(slide, {
    x: 3.55, y: 1.7, w: 2.45, h: 2.0,
    title: "Backend",
    body: "Node.js + Express\nMVC-style controllers\nValidation and middleware\nFile uploads",
    accent: colors.green,
  });
  addInfoCard(slide, {
    x: 6.38, y: 1.7, w: 2.45, h: 2.0,
    title: "Database",
    body: "MongoDB + Mongoose\nUsers\nProjects\nBugs\nAudit Logs\nAgent Conversations",
    accent: colors.orange,
  });
  addInfoCard(slide, {
    x: 9.21, y: 1.7, w: 3.15, h: 2.0,
    title: "Security Layer",
    body: "JWT access tokens\nHTTP-only refresh cookie\nRole-based authorization\nPassword hashing",
    accent: colors.red,
  });
  addBulletList(slide, [
    "Frontend communicates with backend REST APIs.",
    "Backend enforces authentication and role restrictions before serving data.",
    "MongoDB stores project, issue, user, and AI audit records.",
  ], { x: 0.9, y: 4.5, w: 11.2, h: 1.7, fontSize: 17 });
  addFooter(slide, 9);
}

function buildTeamDivision() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.soft };
  addTopBand(slide);
  addSlideTitle(slide, "Team Contribution Division", "Clear ownership of project modules for the viva.");

  slide.addText("Member", {
    x: 0.9, y: 1.55, w: 1.3, h: 0.3, fontSize: 13, bold: true, color: colors.ink,
  });
  slide.addText("Main Responsibility", {
    x: 2.45, y: 1.55, w: 8.8, h: 0.3, fontSize: 13, bold: true, color: colors.ink,
  });

  let y = 1.95;
  teamRows.forEach((row, index) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.82,
      y: y - 0.05,
      w: 11.6,
      h: 0.78,
      rectRadius: 0.04,
      line: { color: colors.border, pt: 1 },
      fill: { color: index % 2 === 0 ? colors.white : "EEF4FB" },
    });
    slide.addText(row[0], {
      x: 0.95, y, w: 1.2, h: 0.25, fontSize: 15, bold: true, color: colors.blue,
    });
    slide.addText(row[1], {
      x: 2.45, y, w: 9.6, h: 0.35, fontSize: 12, color: colors.ink,
    });
    y += 0.92;
  });

  addFooter(slide, 10);
}

function buildDemoFlow() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addTopBand(slide);
  addSlideTitle(slide, "Viva Demonstration Flow", "Recommended order to present the project smoothly.");
  addBulletList(slide, [
    "Log in as Administrator and show role-based access.",
    "Open Dashboard and explain the summary cards and charts.",
    "Show Users page and explain admin-only user management.",
    "Open Projects and demonstrate project creation and team assignment.",
    "Open Issues and show create, edit, status change, and Kanban workflow.",
    "Open Assigned Projects and role-specific visibility.",
    "Show AI Agent for natural language project/issue lookup.",
    "Open AI Audit page and explain transparency and failure tracking.",
  ], { x: 0.95, y: 1.75, w: 11.1, h: 4.7, fontSize: 18 });
  addFooter(slide, 11);
}

function buildFuture() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.soft };
  addTopBand(slide);
  addSlideTitle(slide, "Future Enhancements", "Possible next steps for product and engineering improvement.");
  addBulletList(slide, [
    "More code splitting and performance optimization for smaller bundles.",
    "Richer notification history with stronger activity tracking.",
    "Advanced search, saved filters, and more powerful issue queries.",
    "Further Kanban enhancements with deeper analytics and collaboration features.",
    "Extended profile and settings personalization for end users.",
  ], { x: 0.95, y: 1.75, w: 11.1, h: 4.2, fontSize: 18 });
  addFooter(slide, 12);
}

function buildClosing() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.navy };
  slide.addText("Thank You", {
    x: 4.55,
    y: 2.1,
    w: 4.0,
    h: 0.6,
    fontSize: 30,
    bold: true,
    color: colors.white,
    align: "center",
  });
  slide.addText("Questions and Discussion", {
    x: 4.1,
    y: 2.95,
    w: 5.0,
    h: 0.3,
    fontSize: 16,
    color: "D9E7FF",
    align: "center",
  });
  slide.addText("BugTracker Pro | Final Year Project", {
    x: 4.05,
    y: 4.15,
    w: 5.2,
    h: 0.24,
    fontSize: 12,
    color: "BFD3F5",
    align: "center",
  });
}

buildCover();
buildProblemSolution();
buildObjectives();
buildModules();
buildRoles();
buildWorkflow();
buildDashboard();
buildAI();
buildArchitecture();
buildTeamDivision();
buildDemoFlow();
buildFuture();
buildClosing();

const outputPath = path.join(process.cwd(), "BugTracker-Pro-FYP-Presentation.pptx");

pptx.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Presentation created: ${outputPath}`);
}).catch((error) => {
  console.error("Failed to create presentation:", error);
  process.exit(1);
});
