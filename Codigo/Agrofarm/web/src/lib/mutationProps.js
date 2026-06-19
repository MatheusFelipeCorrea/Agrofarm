import { notify } from "./notify.js";
import { getApiErrorMessage } from "../utils/apiError.js";

/**
 * Props reutilizáveis para `useMutation` — erro da API vira toast legível.
 * @param {string} fallbackMessage
 * @returns {{ onError: (error: unknown) => void }}
 */
export function apiErrorToast(fallbackMessage) {
  return {
    onError(error) {
      notify.error(getApiErrorMessage(error, fallbackMessage));
    },
  };
}

/**
 * Toast de sucesso ao concluir a mutação (criar, editar, excluir).
 * @param {string} message
 * @param {Record<string, unknown>} [toastOptions] opções extras do Sonner (ex.: `id`)
 */
export function apiSuccessToast(message, toastOptions = {}) {
  return {
    onSuccess() {
      notify.success(message, toastOptions);
    },
  };
}
