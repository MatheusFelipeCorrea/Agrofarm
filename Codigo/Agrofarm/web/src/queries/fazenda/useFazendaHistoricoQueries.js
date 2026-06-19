import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { QK_FAZENDAS } from "./useFazendaQueries.js";
import { QK_POLIGONOS } from "../poligono/usePoligonoQueries.js";
import { listarHistoricoMapa, restaurarHistoricoMapa } from "../../services/fazenda/fazenda.service.js";

export const QK_HISTORICO_MAPA = ["historico-mapa"];

export function useHistoricoMapaQuery(fazendaId, params = {}, options = {}) {
  return useQuery({
    queryKey: [...QK_HISTORICO_MAPA, fazendaId, params],
    queryFn: () => listarHistoricoMapa(fazendaId, params),
    enabled: Boolean(fazendaId),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useRestaurarHistoricoMapaMutation(fazendaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (historicoId) => restaurarHistoricoMapa(fazendaId, historicoId),
    ...apiErrorToast("Não foi possível restaurar a área no mapa."),
    ...apiSuccessToast("Área restaurada no mapa com sucesso."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...QK_HISTORICO_MAPA, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_POLIGONOS, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, fazendaId, "detalhe"] });
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}
