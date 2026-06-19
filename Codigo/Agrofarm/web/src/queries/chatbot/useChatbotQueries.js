import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatbotService } from "../../services/chatbot/chatbot.service.js";

export const CHATBOT_SESSOES_KEY = ["chatbot", "sessoes"];
export const CHATBOT_RESUMO_KEY = ["chatbot", "resumo"];
export const chatbotMensagensKey = (sessaoId) => ["chatbot", "mensagens", sessaoId];

export function useChatbotResumoQuery(options = {}) {
  return useQuery({
    queryKey: CHATBOT_RESUMO_KEY,
    queryFn: async () => {
      const res = await chatbotService.buscarResumoDados();
      return res.data.data;
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useChatbotSessoesQuery(options = {}) {
  return useQuery({
    queryKey: CHATBOT_SESSOES_KEY,
    queryFn: async () => {
      const res = await chatbotService.listarSessoes(30);
      return res.data.data;
    },
    staleTime: 30_000,
    ...options,
  });
}

export function useChatbotMensagensQuery(sessaoId, options = {}) {
  return useQuery({
    queryKey: chatbotMensagensKey(sessaoId),
    queryFn: async () => {
      const res = await chatbotService.listarMensagens(sessaoId);
      return res.data.data;
    },
    enabled: Boolean(sessaoId),
    staleTime: 10_000,
    ...options,
  });
}

export function useChatbotEnviarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessaoId, conteudo }) => {
      const res = await chatbotService.enviarMensagem({
        sessaoId: sessaoId ?? undefined,
        conteudo,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHATBOT_SESSOES_KEY });
      queryClient.invalidateQueries({ queryKey: chatbotMensagensKey(data.sessaoId) });
      queryClient.invalidateQueries({ queryKey: CHATBOT_RESUMO_KEY });
    },
  });
}

export function useChatbotRenomearSessaoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessaoId, titulo }) => {
      const res = await chatbotService.renomearSessao(sessaoId, titulo);
      return res.data.data;
    },
    onSuccess: (_data, { sessaoId }) => {
      queryClient.invalidateQueries({ queryKey: CHATBOT_SESSOES_KEY });
      queryClient.invalidateQueries({ queryKey: chatbotMensagensKey(sessaoId) });
    },
  });
}

export function useChatbotExcluirSessaoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessaoId) => {
      await chatbotService.excluirSessao(sessaoId);
      return sessaoId;
    },
    onSuccess: (sessaoId) => {
      queryClient.invalidateQueries({ queryKey: CHATBOT_SESSOES_KEY });
      queryClient.removeQueries({ queryKey: chatbotMensagensKey(sessaoId) });
    },
  });
}
