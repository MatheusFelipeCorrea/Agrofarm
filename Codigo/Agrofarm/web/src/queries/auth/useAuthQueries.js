import { useMutation } from "@tanstack/react-query";
import { notify } from "../../lib/notify.js";
import { apiSuccessToast } from "../../lib/mutationProps.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import {
  login,
  PasswordChangeRequiredError,
  changeInitialPassword,
  changePassword,
} from "../../services/auth/auth.service.js";
import { useAuthStore } from "../../store/authStore.js";

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
    ...apiSuccessToast("Senha atualizada. Bem-vindo!", { duration: 2800 }),
  });
}

export function useChangePassword() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      setSession(data);
    },
    ...apiSuccessToast("Senha alterada com sucesso.", { duration: 3200 }),
  });
}
