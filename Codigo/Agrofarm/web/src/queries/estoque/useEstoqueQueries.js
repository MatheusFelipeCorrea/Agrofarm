import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmarEntregaArrendamento,
  getEstoqueDetalhe,
  listarEstoque,
  marcarEntregaArrendamento,
} from "../../services/estoque/estoque.service.js";
import { apiErrorToast } from "../../lib/mutationProps.js";

const ESTOQUE_QUERY_KEY = ["estoque"];

export function useEstoqueListQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [...ESTOQUE_QUERY_KEY, params],
    queryFn: () => listarEstoque(params),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useEstoqueDetalheQuery(colheitaId, options = {}) {
  return useQuery({
    queryKey: [...ESTOQUE_QUERY_KEY, "detalhe", colheitaId],
    queryFn: () => getEstoqueDetalhe(colheitaId),
    enabled: Boolean(colheitaId),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useConfirmarEntregaArrendamentoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entregaId, colheitaId }) => confirmarEntregaArrendamento(entregaId, colheitaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY });
    },
    ...apiErrorToast("Não foi possível confirmar a saída do estoque."),
  });
}

export function useMarcarEntregaArrendamentoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entregaId, status }) => marcarEntregaArrendamento(entregaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY });
    },
    ...apiErrorToast("Não foi possível atualizar a entrega."),
  });
}
