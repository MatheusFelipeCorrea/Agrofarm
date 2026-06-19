import { toast } from "sonner";

const defaults = {
  success: { duration: 3800 },
  error: { duration: 6500 },
  info: { duration: 4500 },
};

/**
 * @see https://sonner.emilkowal.ski/
 */
export const notify = {
  success(message, options = {}) {
    toast.success(message, { ...defaults.success, ...options });
  },

  error(message, options = {}) {
    toast.error(message, { ...defaults.error, ...options });
  },

  info(message, options = {}) {
    toast.info(message, { ...defaults.info, ...options });
  },

  /** Falha de rede / timeout (id fixo evita spam de toasts). */
  networkError() {
    toast.error("Sem conexão com o servidor. Verifique sua internet ou se a API está no ar.", {
      id: "agrofarm-network",
      duration: 6000,
    });
  },

  /** Operação concluída sem detalhe específico (ex.: exclusão). */
  done(message = "Concluído.") {
    toast.success(message, { duration: 3200 });
  },
};
