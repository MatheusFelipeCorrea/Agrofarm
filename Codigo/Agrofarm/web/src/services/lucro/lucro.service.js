import { api } from "../api.js";

export async function buscarTodos(filtros = {}) {
  const params = {};
  if (filtros.fazendaId) params.fazendaId = filtros.fazendaId;
  if (filtros.culturaId) params.culturaId = filtros.culturaId;
  if (filtros.from) params.from = filtros.from;
  if (filtros.to) params.to = filtros.to;
  if (filtros.mes) params.mes = filtros.mes;
  if (filtros.ano) params.ano = filtros.ano;
  if (filtros.page) params.page = filtros.page;
  if (filtros.pageSize) params.pageSize = filtros.pageSize;

  const { data } = await api.get("/lucros", { params });
  return data.data;
}

export async function buscarTotal(filtros = {}) {
  const params = {};
  if (filtros.fazendaId) params.fazendaId = filtros.fazendaId;
  if (filtros.culturaId) params.culturaId = filtros.culturaId;
  if (filtros.from) params.from = filtros.from;
  if (filtros.to) params.to = filtros.to;
  if (filtros.mes) params.mes = filtros.mes;
  if (filtros.ano) params.ano = filtros.ano;

  const { data } = await api.get("/lucros/total", { params });
  return data.data;
}

export async function buscarPorColheita(id) {
  const { data } = await api.get(`/lucros/colheita/${id}`);
  return data.data;
}

export async function criar(dados) {
  const { data } = await api.post("/lucros", dados);
  return data.data;
}

export async function atualizar(id, dados) {
  const { data } = await api.put(`/lucros/${id}`, dados);
  return data.data;
}

export async function deletar(id) {
  await api.delete(`/lucros/${id}`);
}

export async function marcarRecebimentoArrendamento(id, status) {
  const { data } = await api.patch(`/lucros/${id}/recebimento-arrendamento`, { status });
  return data.data;
}
