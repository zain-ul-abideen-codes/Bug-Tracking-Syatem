import api from "./axios";

export const parseNaturalBugReport = async ({ naturalText, projectId }) => {
  const { data } = await api.post("/ai/parse-bug-report", { naturalText, projectId });
  return data;
};

export const getResolutionCopilot = async (bugId) => {
  const { data } = await api.post("/ai/resolution-copilot", { bugId });
  return data;
};
