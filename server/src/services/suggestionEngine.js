const { ROLES } = require("../utils/constants");

const generateSuggestions = ({
  lastTool = null,
  toolResult = null,
  role = null,
  entities = {},
}) => {
  const suggestions = [];

  if (lastTool === "get_bugs" && toolResult?.data?.length) {
    suggestions.push("Assign a bug to developer");
    suggestions.push("Update status of a bug");
    suggestions.push("Filter by project");
  }

  if (lastTool === "get_my_projects" && toolResult?.data?.length) {
    const firstProjectName = toolResult.data[0]?.title;
    if (firstProjectName) {
      suggestions.push(`Show bugs in ${firstProjectName}`);
      suggestions.push(`Who is assigned to ${firstProjectName}?`);
    }
  }

  if (lastTool === "get_dashboard_stats") {
    suggestions.push("Show unresolved bugs");
    suggestions.push("Which project has most bugs?");
  }

  if (lastTool === "create_bug") {
    suggestions.push("Assign this bug to a developer");
    suggestions.push("Set a deadline for this bug");
  }

  if (role === ROLES.DEVELOPER && !entities?.lastMentionedBugId) {
    suggestions.push("Show my assigned bugs");
    suggestions.push("What's my workload today?");
  }

  if (!suggestions.length) {
    suggestions.push("Show dashboard stats");
    suggestions.push("Search bugs by keyword");
    suggestions.push("Show my projects");
  }

  return [...new Set(suggestions)].slice(0, 3);
};

module.exports = {
  generateSuggestions,
};
