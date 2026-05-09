import api from "./axios";

export const getDashboard = async (token) => {
  const { data } = await api.get("/dashboard", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }
      : undefined,
    params: {
      _t: Date.now(),
    },
  });
  return data;
};
