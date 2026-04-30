const INTENT_PATTERNS = [
  { pattern: /^(hi|hello|hey|salam|assalam|good\s?(morning|evening|afternoon))/i, intent: "greeting" },
  { pattern: /^(thanks?|thank you|shukriya|jazakallah)/i, intent: "thanks" },
  { pattern: /^(bye|goodbye|khuda hafiz|ok bye)/i, intent: "farewell" },
  { pattern: /^(help|commands|kya kar sakta|what can you do)/i, intent: "help" },
  { pattern: /show\s?(me\s?)?(my\s?)?(open\s?)?(bugs?|issues?)/i, intent: "get_bugs_quick" },
  { pattern: /how many bugs/i, intent: "count_bugs" },
  { pattern: /^(dashboard|stats|analytics|overview)/i, intent: "dashboard" },
];

const STATIC_REPLIES = {
  greeting: (name) => `Salam ${name}. Main BugBot hoon aur projects, bugs, dashboards, assignments, aur workflow actions mein madad kar sakta hoon.`,
  thanks: () => "Khushi hui madad karke. Agar chahein to main bugs, projects, ya dashboard stats foran nikaal sakta hoon.",
  farewell: () => "Khuda hafiz. Jab bhi zarurat ho, BugBot se projects aur bugs ke bare mein pooch sakte hain.",
  help: () => [
    "Main in cheezon mein madad kar sakta hoon:",
    "- Show my projects",
    "- Show my bugs",
    "- Dashboard stats",
    "- Search bugs by keyword",
    "- Assign a bug",
    "- Update bug status",
    "- Create a bug or feature",
  ].join("\n"),
};

const detectIntent = (message) => {
  const normalized = String(message || "").trim();
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(normalized)) {
      return intent;
    }
  }
  return null;
};

const getStaticReply = (intent, userName = "there") => {
  const replyBuilder = STATIC_REPLIES[intent];
  if (!replyBuilder) {
    return null;
  }

  return replyBuilder(userName);
};

module.exports = {
  INTENT_PATTERNS,
  STATIC_REPLIES,
  detectIntent,
  getStaticReply,
};
