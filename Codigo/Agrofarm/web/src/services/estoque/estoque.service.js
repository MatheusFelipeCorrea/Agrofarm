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
