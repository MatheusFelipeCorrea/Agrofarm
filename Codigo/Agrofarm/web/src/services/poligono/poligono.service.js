import { api } from "../api.js";

export async function listarPoligonos(fazendaId) {
  const { data } = await api.get("/poligonos", { params: { fazendaId } });
  return {
    poligonos: data.data,
    colheitasArquivadas: data.meta?.colheitasArquivadas ?? 0,
  };
}

export async function buscarPoligono(id) {
  const { data } = await api.get(`/poligonos/${id}`);
  return data.data;
}

export async function criarPoligono(payload) {
  const { data } = await api.post("/poligonos", payload);
  return data.data;
}

export async function atualizarPoligono(id, payload) {
  const { data } = await api.put(`/poligonos/${id}`, payload);
  return data.data;
}

export async function excluirPoligono(id) {
  await api.delete(`/poligonos/${id}`);
}

export async function exportarPoligonos(fazendaId) {
  const { data } = await api.post("/poligonos/exportar", { fazendaId });
  return data;
}

export async function importarPoligonos(fazendaId, geojson) {
  const { data } = await api.post("/poligonos/importar", { fazendaId, geojson });
  return data.data;
}
