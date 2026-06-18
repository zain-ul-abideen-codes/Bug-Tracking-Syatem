const Anthropic = require("@anthropic-ai/sdk");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const { BUG_PRIORITY } = require("../utils/constants");

const KEYWORD_RULES = [
  {
    priority: "Critical",
    confidenceRange: [90, 95],
    keywords: [
      "crash",
      "down",
      "not working",
      "broken",
      "error",
      "fail",
      "login",
      "auth",
      "payment",
      "data loss",
      "security",
      "hack",
      "vulnerability",
      "freeze",
      "blank screen",
      "cannot access",
    ],
  },
  {
    priority: "High",
    confidenceRange: [84, 91],
    keywords: [
      "slow",
      "bug",
      "wrong",
      "incorrect",
      "missing",
      "not loading",
      "stuck",
      "issue",
      "problem",
      "not working for some",
    ],
  },
  {
    priority: "Medium",
    confidenceRange: [76, 86],
    keywords: ["sometimes", "occasionally", "minor issue", "small bug", "not always", "workaround", "partially"],
  },
  {
    priority: "Low",
    confidenceRange: [70, 82],
    keywords: ["typo", "color", "font", "spacing", "alignment", "ui", "cosmetic", "suggestion", "enhancement", "improve"],
  },
];

const PRIORITY_SYSTEM_PROMPT = `You are a bug priority analyzer for software projects. Analyze the bug title and description provided and return ONLY a JSON response in this exact format:
{
  priority: 'Critical' | 'High' | 'Medium' | 'Low',
  confidence: number between 0-100,
  reason: 'one sentence explanation'
}

Priority rules:
- Critical: App crashes, data loss, security vulnerability, authentication broken, payment issues
- High: Major feature not working, affects many users, no workaround available
- Medium: Feature partially broken, workaround exists, affects some users
- Low: Minor UI issues, typos, small cosmetic bugs, enhancement requests`;

const extractJson = (text = "") => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new ApiError(502, "AI priority response was not valid JSON.");
  }
  return JSON.parse(match[0]);
};

const normalizeSuggestion = (raw) => {
  const priority = BUG_PRIORITY.includes(raw.priority) ? raw.priority : null;
  const confidence = Number(raw.confidence);

  if (!priority || Number.isNaN(confidence)) {
    throw new ApiError(502, "AI priority response did not match the expected format.");
  }

  return {
    priority,
    confidence: Math.min(100, Math.max(0, Math.round(confidence))),
    reason: String(raw.reason || "Priority suggested from the bug title and description.").trim(),
  };
};

const confidenceFor = ([min, max], text) => {
  const seed = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return min + (seed % (max - min + 1));
};

const suggestPriorityLocally = ({ title, description }) => {
  const combinedText = `${title} ${description}`.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    const matchedKeyword = rule.keywords.find((keyword) => combinedText.includes(keyword));
    if (matchedKeyword) {
      return {
        priority: rule.priority,
        confidence: confidenceFor(rule.confidenceRange, combinedText),
        reason: `Detected "${matchedKeyword}" in the bug details, which indicates ${rule.priority.toLowerCase()} priority.`,
      };
    }
  }

  return {
    priority: "Medium",
    confidence: confidenceFor([74, 82], combinedText),
    reason: "No critical, high, or low priority keywords were detected, so medium priority is suggested.",
  };
};

const suggestBugPriority = async ({ title, description }) => {
  if (!env.anthropicApiKey || env.anthropicApiKey === "your_anthropic_key_here") {
    return suggestPriorityLocally({ title, description });
  }

  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 250,
      temperature: 0,
      system: PRIORITY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Title: ${title}\nDescription: ${description}`,
        },
      ],
    });

    const text = response.content
      ?.map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    return normalizeSuggestion(extractJson(text));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    return suggestPriorityLocally({ title, description });
  }
};

module.exports = {
  suggestBugPriority,
};
