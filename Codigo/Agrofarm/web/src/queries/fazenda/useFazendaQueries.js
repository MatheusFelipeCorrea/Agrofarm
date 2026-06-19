import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import {
  adicionarCulturaNaFazenda,
  atualizarCulturaDaFazenda,
  atualizarFazenda,
  buscarFazenda,
  buscarFazendaDetalhe,
  criarFazenda,
  excluirCulturaDaFazenda,
  excluirFazenda,
  listarCulturasDaFazenda,
  listarFazendas,
} from "../../services/fazenda/fazenda.service.js";

export const QK_FAZENDAS = ["fazendas"];

export function useFazendaListQuery(options = {}) {
  return useQuery({
    queryKey: QK_FAZENDAS,
    queryFn: listarFazendas,
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
}

export function useFazendaByIdQuery(id, options = {}) {
  return useQuery({
    queryKey: [...QK_FAZENDAS, id],
    queryFn: () => buscarFazenda(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useFazendaDetalheQuery(id, options = {}) {
  return useQuery({
    queryKey: [...QK_FAZENDAS, id, "detalhe"],
    queryFn: () => buscarFazendaDetalhe(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useCreateFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarFazenda,
    ...apiErrorToast("Não foi possível criar a fazenda."),
    ...apiSuccessToast("Fazenda criada com sucesso."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK_FAZENDAS }),
  });
}

export function useUpdateFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizarFazenda(id, payload),
    ...apiErrorToast("Não foi possível atualizar a fazenda."),
    ...apiSuccessToast("Fazenda atualizada com sucesso."),
    onSettled: (_data, _error, vars) => {
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
      if (vars?.id) {
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.id] });
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.id, "detalhe"] });
        qc.invalidateQueries({ queryKey: ["colheitas", "fazenda", vars.id] });
      }
    },
  });
}

export function useDeleteFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: excluirFazenda,
    ...apiErrorToast("Não foi possível excluir a fazenda."),
    ...apiSuccessToast("Fazenda excluída."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK_FAZENDAS }),
  });
}

// Culturas da fazenda (fazenda_culturas)
export function useCulturasDaFazendaQuery(fazendaId, options = {}) {
  return useQuery({
    queryKey: [...QK_FAZENDAS, fazendaId, "culturas"],
    queryFn: () => listarCulturasDaFazenda(fazendaId),
    enabled: Boolean(fazendaId),
    staleTime: 15_000,
    retry: 1,
    ...options,
  });
}

export function useAddCulturaNaFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fazendaId, payload }) => adicionarCulturaNaFazenda(fazendaId, payload),
    ...apiErrorToast("Não foi possível vincular a cultura à fazenda."),
    ...apiSuccessToast("Cultura vinculada à fazenda."),
    onSettled: (_data, _error, vars) => {
      if (vars?.fazendaId) {
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId] });
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId, "culturas"] });
      }
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}

export function useUpdateCulturaDaFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fazendaId, vinculoId, payload }) => atualizarCulturaDaFazenda(fazendaId, vinculoId, payload),
    ...apiErrorToast("Não foi possível atualizar a cultura na fazenda."),
    ...apiSuccessToast("Cultura na fazenda atualizada."),
    onSettled: (_data, _error, vars) => {
      if (vars?.fazendaId) {
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId] });
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId, "culturas"] });
      }
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}

export function useDeleteCulturaDaFazendaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fazendaId, vinculoId }) => excluirCulturaDaFazenda(fazendaId, vinculoId),
    ...apiErrorToast("Não foi possível remover a cultura da fazenda."),
    ...apiSuccessToast("Cultura removida da fazenda."),
    onSettled: (_data, _error, vars) => {
      if (vars?.fazendaId) {
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId] });
        qc.invalidateQueries({ queryKey: [...QK_FAZENDAS, vars.fazendaId, "culturas"] });
      }
      qc.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
}

