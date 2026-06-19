import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { QK_FAZENDAS } from "../fazenda/useFazendaQueries.js";
import { QK_HISTORICO_MAPA } from "../fazenda/useFazendaHistoricoQueries.js";
import {
  atualizarPoligono,
  criarPoligono,
  excluirPoligono,
  listarPoligonos,
} from "../../services/poligono/poligono.service.js";

export const QK_POLIGONOS = ["poligonos"];

export function usePoligonosQuery(fazendaId, options = {}) {
  return useQuery({
    queryKey: [...QK_POLIGONOS, fazendaId],
    queryFn: () => listarPoligonos(fazendaId),
    enabled: Boolean(fazendaId),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useCreatePoligonoMutation(fazendaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarPoligono,
    ...apiErrorToast("Não foi possível criar a área."),
    ...apiSuccessToast("Área criada com sucesso."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...QK_POLIGONOS, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, fazendaId, "culturas"] });
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}

export function useUpdatePoligonoMutation(fazendaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizarPoligono(id, payload),
    ...apiErrorToast("Não foi possível atualizar a área."),
    ...apiSuccessToast("Área atualizada com sucesso."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...QK_POLIGONOS, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, fazendaId, "culturas"] });
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}

export function useDeletePoligonoMutation(fazendaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: excluirPoligono,
    ...apiErrorToast("Não foi possível excluir a área."),
    ...apiSuccessToast("Área excluída com sucesso."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...QK_POLIGONOS, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_HISTORICO_MAPA, fazendaId] });
      qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, fazendaId, "detalhe"] });
      qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, fazendaId, "culturas"] });
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}
