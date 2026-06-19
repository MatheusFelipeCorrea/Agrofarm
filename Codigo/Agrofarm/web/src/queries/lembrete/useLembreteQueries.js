import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lembreteService } from "../../services/lembrete/lembrete.service";
import { QK_FAZENDAS } from "../fazenda/useFazendaQueries.js";

export const useLembreteCalendarioQuery = ({ mes, ano, fazendaId, status }) =>
  useQuery({
    queryKey: ["lembretes-calendario", mes, ano, fazendaId ?? "", status ?? ""],
    queryFn: async () => {
      const res = await lembreteService.buscarCalendario({ mes, ano, fazendaId, status });

      return res.data.data;
    },
  });

export const useLembreteDiaQuery = ({ data, status, fazendaId }) =>
  useQuery({
    queryKey: ["lembretes-dia", data, status, fazendaId],
    queryFn: async () => {
      const res = await lembreteService.buscarPorDia({
        data,
        status,
        fazendaId,
      });
      return res.data.data;
    },
    enabled: !!data,
  });

export const useUpdateLembreteStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => lembreteService.atualizarStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lembretes-dia"] });
      queryClient.invalidateQueries({ queryKey: ["lembretes-calendario"] });
      queryClient.invalidateQueries({ queryKey: QK_FAZENDAS });
    },
  });
};

function invalidateLembreteCaches(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["lembretes-dia"] });
  queryClient.invalidateQueries({ queryKey: ["lembretes-calendario"] });
  queryClient.invalidateQueries({ queryKey: QK_FAZENDAS });
}

export const useDeleteLembreteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => lembreteService.deletar(id),

    onSuccess: () => invalidateLembreteCaches(queryClient),
  });
};

export const useUpdateLembreteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      lembreteService.atualizar(id, data),

    onSuccess: () => invalidateLembreteCaches(queryClient),
  });
};

export const useCreateLembreteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => lembreteService.criar(data),

    onSuccess: () => invalidateLembreteCaches(queryClient),
  });
};
