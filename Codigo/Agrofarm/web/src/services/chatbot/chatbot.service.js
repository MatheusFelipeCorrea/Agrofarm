import { api } from "../api";

export const chatbotService = {
  buscarResumoDados: () => api.get("/chatbot/resumo"),

  listarSessoes: (limite = 20) =>
    api.get("/chatbot/sessoes", { params: { limite } }),

  listarMensagens: (sessaoId) =>
    api.get(`/chatbot/sessoes/${sessaoId}/mensagens`),

  enviarMensagem: (payload) => api.post("/chatbot/mensagens", payload),

  renomearSessao: (sessaoId, titulo) =>
    api.patch(`/chatbot/sessoes/${sessaoId}`, { titulo }),

  excluirSessao: (sessaoId) => api.delete(`/chatbot/sessoes/${sessaoId}`),
};
