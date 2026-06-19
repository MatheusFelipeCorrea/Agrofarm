import { api } from "../api.js";

export async function listarCulturas() {
  const { data } = await api.get("/culturas");
  return Array.isArray(data?.culturas) ? data.culturas : [];
}

export async function criarCultura(payload) {
  const { data } = await api.post("/culturas", payload);
  return data.cultura;
}

export async function atualizarCultura(id, payload) {
  const { data } = await api.put(`/culturas/${id}`, payload);
  return data.cultura;
}

export async function excluirCultura(id) {
  await api.delete(`/culturas/${id}`);
}

