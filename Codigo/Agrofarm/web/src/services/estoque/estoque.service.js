import { api } from "../api.js";

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  );
}

export async function listarEstoque(params = {}) {
  const { data } = await api.get("/estoque", { params: cleanParams(params) });
  return data.data;
}

export async function getEstoqueDetalhe(colheitaId) {
  const { data } = await api.get(`/estoque/${colheitaId}`);
  return data.data;
}

export async function confirmarEntregaArrendamento(entregaId, colheitaId) {
  const { data } = await api.patch(`/estoque/arrendamento/${entregaId}/confirmar`, { colheitaId });
  return data.data;
}

export async function marcarEntregaArrendamento(entregaId, status) {
  const { data } = await api.patch(`/estoque/arrendamento/${entregaId}/status`, { status });
  return data.data;
}
