import api from "./axios";

export const getBugs = async () => {
  const { data } = await api.get("/bugs");
  return data.bugs;
};

export const createBug = async (payload) => {
  const { data } = await api.post("/bugs", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateBug = async (id, payload) => {
  const config =
    payload instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
  const { data } = await api.put(`/bugs/${id}`, payload, config);
  return data;
};

export const deleteBug = async (id) => {
  const { data } = await api.delete(`/bugs/${id}`);
  return data;
};
