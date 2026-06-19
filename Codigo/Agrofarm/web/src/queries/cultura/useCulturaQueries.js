import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { atualizarCultura, criarCultura, excluirCultura, listarCulturas } from "../../services/cultura/cultura.service.js";

const QK = ["culturas"];

export function useCulturaListQuery(options = {}) {
  return useQuery({
    queryKey: QK,
    queryFn: listarCulturas,
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
}

export function useCreateCulturaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarCultura,
    ...apiErrorToast("Não foi possível criar a cultura."),
    ...apiSuccessToast("Cultura criada no catálogo."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useUpdateCulturaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizarCultura(id, payload),
    ...apiErrorToast("Não foi possível atualizar a cultura."),
    ...apiSuccessToast("Cultura atualizada no catálogo."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteCulturaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: excluirCultura,
    ...apiErrorToast("Não foi possível excluir a cultura."),
    ...apiSuccessToast("Cultura excluída do catálogo."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

