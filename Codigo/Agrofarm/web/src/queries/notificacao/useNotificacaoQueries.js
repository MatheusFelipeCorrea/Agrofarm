import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificacaoService } from "../../services/notificacao/notificacao.service.js";

const NOTIFICACOES_QUERY_KEY = ["notificacoes"];

export function useNotificacoesQuery({ enabled = true, limit = 20 } = {}) {
  return useQuery({
    queryKey: [...NOTIFICACOES_QUERY_KEY, limit],
    queryFn: async () => {
      const response = await notificacaoService.listar({ limit });
      return response.data.data;
    },
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
}

export function useMarcarNotificacaoComoLidaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificacaoService.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEY });
    },
  });
}

export function useMarcarTodasNotificacoesComoLidasMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificacaoService.marcarTodasComoLidas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEY });
    },
  });
}
