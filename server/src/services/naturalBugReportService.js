const OpenAI = require("openai");
const ApiError = require("../utils/apiError");
const env = require("../config/env");
const { BUG_PRIORITY, BUG_TYPES } = require("../utils/constants");

const BUG_REPORT_SYSTEM_PROMPT = `You convert natural language QA reports into structured bug reports.
Return ONLY valid JSON in this exact shape:
{
  "title": "short clear bug title max 10 words",
  "description": "detailed explanation in English",
  "stepsToReproduce": "numbered steps",
  "expectedResult": "expected result",
  "actualResult": "actual result",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "type": "bug" | "feature",
  "suggestedStatus": "new",
  "confidence": "high" | "medium" | "low"
}

Rules:
- Detect Urdu, Roman Urdu, or English input, but always return English JSON.
- If the input is vague, still make a best guess and set confidence to "low".
- Use "bug" for broken behavior and "feature" only for enhancement/new capability requests.
- suggestedStatus must always be "new".`;

const extractJson = (text = "") => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new ApiError(502, "AI response was not valid JSON.");
  }
  return JSON.parse(match[0]);
};

const normalizeParsedReport = (raw) => {
  const priority = BUG_PRIORITY.includes(raw.priority) ? raw.priority : "Medium";
  const type = Object.values(BUG_TYPES).includes(raw.type) ? raw.type : BUG_TYPES.BUG;
  const confidence = ["high", "medium", "low"].includes(raw.confidence) ? raw.confidence : "low";

  return {
    title: String(raw.title || "Untitled bug report").trim().split(/\s+/).slice(0, 10).join(" "),
    description: String(raw.description || "No detailed explanation was generated.").trim(),
    stepsToReproduce: String(raw.stepsToReproduce || "1. Open the affected area.\n2. Try the reported action.").trim(),
    expectedResult: String(raw.expectedResult || "The feature should work as expected.").trim(),
    actualResult: String(raw.actualResult || "The reported behavior occurs.").trim(),
    priority,
    type,
    suggestedStatus: "new",
    confidence,
  };
};

const titleCase = (text = "") =>
  text
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const localPriorityFromText = (text = "") => {
  const lowerText = text.toLowerCase();
  const criticalKeywords = ["crash", "401", "login", "auth", "payment", "security", "data loss", "cannot access", "down"];
  const highKeywords = ["not saving", "not working", "error", "fail", "broken", "not loading", "missing", "stuck"];
  const lowKeywords = ["typo", "color", "font", "spacing", "alignment", "ui", "cosmetic"];

  if (criticalKeywords.some((keyword) => lowerText.includes(keyword))) return "Critical";
  if (highKeywords.some((keyword) => lowerText.includes(keyword))) return "High";
  if (lowKeywords.some((keyword) => lowerText.includes(keyword))) return "Low";
  return "Medium";
};

const localTypeFromText = (text = "") => {
  const lowerText = text.toLowerCase();
  const featureWords = ["feature", "add", "enhancement", "improve", "suggestion", "new option"];
  return featureWords.some((word) => lowerText.includes(word)) ? BUG_TYPES.FEATURE : BUG_TYPES.BUG;
};

const inferArea = (text = "") => {
  const lowerText = text.toLowerCase();
  const areas = [
    ["login", "login page"],
    ["patient", "patient records page"],
    ["payment", "payment module"],
    ["dashboard", "dashboard"],
    ["profile", "profile page"],
    ["report", "reports page"],
    ["button", "screen containing the reported button"],
    ["form", "affected form"],
    ["database", "record saving flow"],
  ];
  const match = areas.find(([keyword]) => lowerText.includes(keyword));
  return match?.[1] || "affected page";
};

const inferAction = (text = "") => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("save") || lowerText.includes("saving")) return "enter valid data and click Save";
  if (lowerText.includes("click")) return "click the reported button";
  if (lowerText.includes("login")) return "enter valid login credentials and submit the form";
  if (lowerText.includes("upload")) return "upload the reported file";
  if (lowerText.includes("search")) return "perform the reported search";
  if (lowerText.includes("delete")) return "try to delete the reported record";
  if (lowerText.includes("update") || lowerText.includes("edit")) return "update the reported information";
  return "perform the action described by the reporter";
};

const inferExpectedResult = (text = "") => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("save") || lowerText.includes("database")) return "The record should save successfully and remain available after refresh.";
  if (lowerText.includes("login") || lowerText.includes("401")) return "The user should be authenticated successfully without an authorization error.";
  if (lowerText.includes("click")) return "The clicked control should perform its intended action.";
  if (lowerText.includes("upload")) return "The selected file should upload successfully.";
  if (lowerText.includes("search")) return "Relevant results should appear for the search query.";
  return "The application should complete the reported action successfully without errors.";
};

const buildLocalSteps = (text = "") => {
  const area = inferArea(text);
  const action = inferAction(text);
  const observeStep =
    text.toLowerCase().includes("console") ||
    text.toLowerCase().includes("401") ||
    text.toLowerCase().includes("error")
      ? "3. Check the screen and browser console for the reported error."
      : "3. Observe the result shown by the application.";

  return `1. Open the ${area}.\n2. ${action.charAt(0).toUpperCase()}${action.slice(1)}.\n${observeStep}`;
};

const parseNaturalBugReportLocally = (naturalText = "") => {
  const trimmedText = naturalText.trim();
  const firstSentence = trimmedText.split(/[.!?۔]/)[0] || trimmedText;
  const priority = localPriorityFromText(trimmedText);
  const type = localTypeFromText(trimmedText);
  const title = titleCase(firstSentence) || "Reported Issue Needs Review";
  const confidence = trimmedText.length < 40 ? "low" : priority === "Critical" || priority === "High" ? "medium" : "low";

  return normalizeParsedReport({
    title,
    description: `The user reported: "${trimmedText}". This report was structured locally because the AI parser was unavailable.`,
    stepsToReproduce: buildLocalSteps(trimmedText),
    expectedResult: inferExpectedResult(trimmedText),
    actualResult: trimmedText,
    priority,
    type,
    suggestedStatus: "new",
    confidence,
  });
};

const parseNaturalBugReport = async ({ naturalText }) => {
  if (!env.openAiApiKey) {
    return parseNaturalBugReportLocally(naturalText);
  }

  const client = new OpenAI({ apiKey: env.openAiApiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      messages: [
        { role: "system", content: BUG_REPORT_SYSTEM_PROMPT },
        { role: "user", content: naturalText },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "";
    return normalizeParsedReport(extractJson(text));
  } catch (error) {
    if (error instanceof ApiError) {
      return parseNaturalBugReportLocally(naturalText);
    }
    return parseNaturalBugReportLocally(naturalText);
  }
};

module.exports = {
  parseNaturalBugReport,
};
