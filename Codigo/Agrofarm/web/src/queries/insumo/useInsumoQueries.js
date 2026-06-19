import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { createInsumo, deleteInsumo, listInsumos, updateInsumo } from "../../services/insumo/insumo.service.js";

const INSUMO_QUERY_KEY = ["insumos"];

export function useInsumoListQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [...INSUMO_QUERY_KEY, params],
    queryFn: () => listInsumos(params),
    staleTime: 10_000,
    retry: 1,
    ...options,
  });
}

export function useCreateInsumoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInsumo,
    ...apiErrorToast("Não foi possível registrar o consumo."),
    ...apiSuccessToast("Consumo registrado."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INSUMO_QUERY_KEY }),
  });
}

export function useUpdateInsumoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateInsumo(id, payload),
    ...apiErrorToast("Não foi possível atualizar o registro."),
    ...apiSuccessToast("Registro atualizado."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INSUMO_QUERY_KEY }),
  });
}

export function useDeleteInsumoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInsumo,
    ...apiErrorToast("Não foi possível excluir o registro."),
    ...apiSuccessToast("Registro excluído."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INSUMO_QUERY_KEY }),
  });
}
