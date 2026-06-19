import { api } from "../api.js";

/**
 * @typedef {Object} ListInsumosParams
 * @property {string} fazendaId
 * @property {"FERTILIZANTE"|"DEFENSIVO"|"SEMENTE"|"OUTRO"=} categoria
 * @property {string=} itemNome
 * @property {string=} from
 * @property {string=} to
 * @property {number=} page
 * @property {number=} pageSize
 */

/** @param {ListInsumosParams} params */
export async function listInsumos(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  );
  const { data } = await api.get("/insumos", { params: cleaned });
  return data.data;
}

export async function createInsumo(payload) {
  const { data } = await api.post("/insumos", payload);
  return data.data;
}

export async function updateInsumo(id, payload) {
  const { data } = await api.put(`/insumos/${id}`, payload);
  return data.data;
}

export async function deleteInsumo(id) {
  await api.delete(`/insumos/${id}`);
}
