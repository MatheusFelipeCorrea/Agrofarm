import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import {
  atualizar,
  buscarTotal,
  buscarTodos,
  criar,
  deletar,
} from "../../services/lucro/lucro.service.js";

const LUCRO_QUERY_KEY = ["lucros"];

export function useLucroListQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: [...LUCRO_QUERY_KEY, filters],
    queryFn: () => buscarTodos(filters),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useLucroTotalQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: [...LUCRO_QUERY_KEY, "total", filters],
    queryFn: () => buscarTotal(filters),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

function invalidateLucroRelated(queryClient) {
  queryClient.invalidateQueries({ queryKey: LUCRO_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ["estoque"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["colheitas"] });
}

export function useCreateLucroMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criar,
    ...apiErrorToast("Não foi possível registrar o lucro."),
    ...apiSuccessToast("Lucro registrado com sucesso."),
    onSettled: () => invalidateLucroRelated(queryClient),
  });
}

export function useUpdateLucroMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizar(id, payload),
    ...apiErrorToast("Não foi possível atualizar o lucro."),
    ...apiSuccessToast("Lucro atualizado com sucesso."),
    onSettled: () => invalidateLucroRelated(queryClient),
  });
}

export function useDeleteLucroMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletar,
    ...apiErrorToast("Não foi possível excluir o lucro."),
    ...apiSuccessToast("Lucro excluído com sucesso."),
    onSettled: () => invalidateLucroRelated(queryClient),
  });
}
