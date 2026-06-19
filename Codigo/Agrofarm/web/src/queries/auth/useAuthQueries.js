import { useMutation } from "@tanstack/react-query";
import { notify } from "../../lib/notify.js";
import { apiSuccessToast } from "../../lib/mutationProps.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { login, PasswordChangeRequiredError, changeInitialPassword } from "../../services/auth/auth.service.js";

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onError(error) {
      if (error instanceof PasswordChangeRequiredError) return;
      notify.error(getApiErrorMessage(error, "Não foi possível entrar. Verifique email e senha."));
    },
    ...apiSuccessToast("Login realizado.", { duration: 2800 }),
  });
}

export function useChangeInitialPassword() {
  return useMutation({
    mutationFn: changeInitialPassword,
    onError(error) {
      notify.error(getApiErrorMessage(error, "Não foi possível alterar a senha."));
    },
    ...apiSuccessToast("Senha atualizada. Bem-vindo!", { duration: 2800 }),
  });
}
