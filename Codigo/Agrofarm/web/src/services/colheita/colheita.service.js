import { api } from "../api.js";

export async function listarColheitas(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  );
  const { data } = await api.get("/colheitas", { params: cleaned });
  return data.data;
}

export async function buscarColheitaPorId(id) {
  const { data } = await api.get(`/colheitas/${id}`);
  return data.data;
}

export async function buscarColheitasPorFazenda(fazendaId) {
  const { data } = await api.get(`/colheitas/fazenda/${fazendaId}`);
  return data.data;
}

export async function criarColheita(payload) {
  const { data } = await api.post("/colheitas", payload);
  return data.data;
}

export async function atualizarColheita(id, payload) {
  const { data } = await api.put(`/colheitas/${id}`, payload);
  return data.data;
}

export async function excluirColheita(id) {
  await api.delete(`/colheitas/${id}`);
}

