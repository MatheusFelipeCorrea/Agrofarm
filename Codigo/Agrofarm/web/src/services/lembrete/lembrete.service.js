import { api } from "../api";

const cleanParams = (params) => {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v));
};

export const lembreteService = {
  buscarPorDia: ({ data, status, fazendaId }) =>
    api.get("/lembretes/dia", {
      params: cleanParams({ data, status, fazendaId }),
    }),

  buscarCalendario: ({ mes, ano, fazendaId, status }) =>
    api.get("/lembretes/calendario", {
      params: cleanParams({ mes, ano, fazendaId, status }),
    }),

  criar: (data) => api.post("/lembretes", data),

  atualizar: (id, data) => api.put(`/lembretes/${id}`, data),

  atualizarStatus: (id, status) =>
    api.patch(`/lembretes/${id}/status`, { status }),

  deletar: (id) => api.delete(`/lembretes/${id}`),
};
