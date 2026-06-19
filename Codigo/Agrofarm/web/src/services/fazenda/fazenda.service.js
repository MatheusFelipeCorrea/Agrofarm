import { api } from "../api.js";

export async function listarFazendas() {
  const { data } = await api.get("/fazendas");
  return Array.isArray(data?.fazendas) ? data.fazendas : [];
}

export async function buscarFazenda(id) {
  const { data } = await api.get(`/fazendas/${id}`);
  return data.fazenda;
}

export async function buscarFazendaDetalhe(id) {
  const { data } = await api.get(`/fazendas/${id}/detalhe`);
  return data.fazenda;
}

export async function criarFazenda(payload) {
  const { data } = await api.post("/fazendas", payload);
  return data.fazenda;
}

export async function atualizarFazenda(id, payload) {
  const { data } = await api.put(`/fazendas/${id}`, payload);
  return data.fazenda;
}

export async function excluirFazenda(id) {
  await api.delete(`/fazendas/${id}`);
}

// Culturas na fazenda (fazenda_culturas)
export async function listarCulturasDaFazenda(fazendaId) {
  const { data } = await api.get(`/fazendas/${fazendaId}/culturas`);
  return data.culturas;
}

export async function adicionarCulturaNaFazenda(fazendaId, payload) {
  const { data } = await api.post(`/fazendas/${fazendaId}/culturas`, payload);
  return data.cultura;
}

export async function atualizarCulturaDaFazenda(fazendaId, vinculoId, payload) {
  const { data } = await api.put(`/fazendas/${fazendaId}/culturas/${vinculoId}`, payload);
  return data.cultura;
}

export async function excluirCulturaDaFazenda(fazendaId, vinculoId) {
  await api.delete(`/fazendas/${fazendaId}/culturas/${vinculoId}`);
}

export async function listarHistoricoMapa(fazendaId, params = {}) {
  const { data } = await api.get(`/fazendas/${fazendaId}/historico-mapa`, { params });
  return data.data;
}

export async function restaurarHistoricoMapa(fazendaId, historicoId) {
  const { data } = await api.post(`/fazendas/${fazendaId}/historico-mapa/${historicoId}/restaurar`);
  return data.data;
}

