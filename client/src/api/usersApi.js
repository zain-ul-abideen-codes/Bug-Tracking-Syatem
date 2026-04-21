import api from "./axios";

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data.users;
};

export const createUser = async (payload) => {
  const { data } = await api.post("/users", payload);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const resetPassword = async (id, newPassword) => {
  const { data } = await api.patch(`/users/${id}/reset-password`, { newPassword });
  return data;
};
