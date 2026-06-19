import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import { cadastroUsuario } from "../../services/auth/auth.service.js";
import { atualizarUsuario, excluirUsuario, listarUsuarios } from "../../services/usuario/usuario.service.js";

const QK = ["usuarios"];

export function useUsuarioListQuery(options = {}) {
  return useQuery({
    queryKey: QK,
    queryFn: listarUsuarios,
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
}

export function useCreateUsuarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    ...apiErrorToast("Não foi possível criar o usuário."),
    ...apiSuccessToast("Usuário criado com sucesso."),
    mutationFn: async ({ nome, email, role, telefone, fazendaIds }) => {
      const { usuario } = await cadastroUsuario({ nome, email, role, telefone, fazendaIds });
      return usuario;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useUpdateUsuarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => atualizarUsuario(id, payload),
    onError: () => {
      /* Erro exibido no modal de formulário (GerenciarUsuarios). */
    },
    ...apiSuccessToast("Usuário atualizado com sucesso."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteUsuarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => excluirUsuario(id),
    ...apiErrorToast("Não foi possível excluir o usuário."),
    ...apiSuccessToast("Usuário excluído."),
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
