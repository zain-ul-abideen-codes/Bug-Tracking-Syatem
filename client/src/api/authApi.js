import api from "./axios";

export const loginRequest = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const refreshRequest = async () => {
  const { data } = await api.post("/auth/refresh");
  return data;
};

export const logoutRequest = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const meRequest = async (token) => {
  const { data } = await api.get("/auth/me", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  return data;
};
