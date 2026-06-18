import api from "./axios";

export const getProjects = async (token) => {
  const { data } = await api.get("/projects", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data.projects;
};

export const getProjectMembers = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
};

export const createProject = async (payload) => {
  const { data } = await api.post("/projects", payload);
  return data;
};

export const updateProject = async (id, payload) => {
  const { data } = await api.put(`/projects/${id}`, payload);
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
};
