import { useQuery } from "@tanstack/react-query";
import { getEstoqueDetalhe, listarEstoque } from "../../services/estoque/estoque.service.js";

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
