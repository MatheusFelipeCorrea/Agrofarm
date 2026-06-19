import { api } from "../api.js";

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function listarNoticias(params = {}) {
  const { data } = await api.get("/noticias", { params: cleanParams(params) });
  return data?.data ?? data;
}
