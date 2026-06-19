import { useQuery } from "@tanstack/react-query";
import { buscarDashboard } from "../../services/dashboard/dashboard.service.js";

export const DASHBOARD_QUERY_KEY = ["dashboard"];

export function getDashboardQueryOptions(fazendaId) {
  const fazendaSelecionada = fazendaId || "todas";

  return {
    queryKey: [...DASHBOARD_QUERY_KEY, { fazendaId: fazendaSelecionada }],
    queryFn: () => buscarDashboard(fazendaSelecionada),
    staleTime: 15_000,
    retry: 1,
  };
}

export function useDashboardQuery(fazendaId, options = {}) {
  return useQuery({
    ...getDashboardQueryOptions(fazendaId),
    ...options,
  });
}
