import { api } from "../api.js";

/**
 * @typedef {Object} ListGastosParams
 * @property {string=} fazendaId
 * @property {string=} culturaId
 * @property {"PAGO"|"PENDENTE"=} status
 * @property {string=} from YYYY-MM-DD
 * @property {string=} to YYYY-MM-DD
 * @property {number=} page
 * @property {number=} pageSize
 */

/**
 * @param {ListGastosParams=} params
 */
export async function listGastos(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  );
  const { data } = await api.get("/gastos", { params: cleaned });
  // backend: { status: "success", data: { items, totals, meta } }
  return data.data;
}

export async function getGastosResumo(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  );
  const { data } = await api.get("/gastos/resumo", { params: cleaned });
  return data.data;
}

export async function createGasto(payload) {
  const { data } = await api.post("/gastos", payload);
  return data.data;
}

export async function updateGasto(id, payload) {
  const { data } = await api.put(`/gastos/${id}`, payload);
  return data.data;
}

export async function deleteGasto(id) {
  await api.delete(`/gastos/${id}`);
}

/** Confirma recebimento de parcela de arrendamento (registra em Lucros). */
export async function confirmarArrendamentoRecebimento(lucroId) {
  const { data } = await api.patch(`/gastos/arrendamento/${lucroId}/confirmar-recebimento`);
  return data.data;
}
