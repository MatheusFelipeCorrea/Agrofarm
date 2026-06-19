import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import {
  confirmarArrendamentoRecebimento,
  createGasto,
  deleteGasto,
  getGastosResumo,
  listGastos,
  updateGasto,
} from "../../services/gasto/gasto.service.js";

const GASTO_QUERY_KEY = ["gastos"];

export function useGastoListQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [...GASTO_QUERY_KEY, params],
    queryFn: () => listGastos(params),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useGastoResumoQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [...GASTO_QUERY_KEY, "resumo", params],
    queryFn: () => getGastosResumo(params),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useCreateGastoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGasto,
    ...apiErrorToast("Não foi possível registrar o gasto."),
    ...apiSuccessToast("Gasto registrado."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: GASTO_QUERY_KEY }),
  });
}

export function useUpdateGastoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateGasto(id, payload),
    ...apiErrorToast("Não foi possível atualizar o gasto."),
    ...apiSuccessToast("Gasto atualizado."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: GASTO_QUERY_KEY }),
  });
}

export function useDeleteGastoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGasto,
    ...apiErrorToast("Não foi possível excluir o gasto."),
    ...apiSuccessToast("Gasto excluído."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: GASTO_QUERY_KEY }),
  });
}

export function useConfirmarArrendamentoGastoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmarArrendamentoRecebimento,
    ...apiErrorToast("Não foi possível confirmar o recebimento."),
    ...apiSuccessToast("Recebimento confirmado e registrado em Lucros."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GASTO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["lucros"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}
