import api from "./axios";

export const getDashboard = async (token) => {
  const { data } = await api.get("/dashboard", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  return data;
};
