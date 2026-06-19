import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import {
  atualizarColheita,
  criarColheita,
  excluirColheita,
  listarColheitas,
} from "../../services/colheita/colheita.service.js";

const COLHEITAS_QUERY_KEY = ["colheitas"];

export function useColheitaListQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [...COLHEITAS_QUERY_KEY, params],
    queryFn: () => listarColheitas(params),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

function invalidateColheitaRelated(queryClient) {
  queryClient.invalidateQueries({ queryKey: COLHEITAS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ["estoque"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["gastos"] });
  queryClient.invalidateQueries({ queryKey: ["lucros"] });
}

export function useCreateColheitaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarColheita,
    ...apiErrorToast("Não foi possível registrar a colheita."),
    ...apiSuccessToast("Colheita registrada."),
    onSettled: () => invalidateColheitaRelated(queryClient),
  });
}

export function useUpdateColheitaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizarColheita(id, payload),
    ...apiErrorToast("Não foi possível atualizar a colheita."),
    ...apiSuccessToast("Colheita atualizada."),
    onSettled: () => invalidateColheitaRelated(queryClient),
  });
}

export function useDeleteColheitaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: excluirColheita,
    ...apiErrorToast("Não foi possível excluir a colheita."),
    ...apiSuccessToast("Colheita excluída."),
    onSettled: () => invalidateColheitaRelated(queryClient),
  });
}

