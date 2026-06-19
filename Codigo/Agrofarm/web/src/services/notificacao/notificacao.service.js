import { api } from "../api.js";

export const notificacaoService = {
  listar: ({ limit = 20 } = {}) => api.get("/notificacoes", { params: { limit } }),
  marcarComoLida: (id) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasComoLidas: () => api.patch("/notificacoes/lidas"),
};
