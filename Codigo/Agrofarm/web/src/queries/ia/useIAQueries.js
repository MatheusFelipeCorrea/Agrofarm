import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { atualizarInsight, buscarInsights } from "../../services/ia/ia.service.js";

const INSIGHTS_KEY = ["ia", "insights"];
const AUTO_REFRESH_MS = 60 * 60 * 1000;

export function useInsightsQuery(fazendaId, options = {}) {
  return useQuery({
    queryKey: [...INSIGHTS_KEY, fazendaId || "todas"],
    queryFn: () => buscarInsights(fazendaId || "todas"),
    staleTime: 30_000,
    ...options,
  });
}

export function useRefreshInsightMutation(fazendaId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      const params = typeof payload === "string" ? { tipo: payload } : payload;
      return atualizarInsight({ ...params, fazendaId: fazendaId || "todas" });
    },
    ...apiErrorToast("Não foi possível atualizar o insight."),
    ...apiSuccessToast("Insight atualizado."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...INSIGHTS_KEY, fazendaId || "todas"] });
    },
  });
}

export { AUTO_REFRESH_MS as INSIGHTS_AUTO_REFRESH_MS };
