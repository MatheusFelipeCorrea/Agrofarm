import axios from "axios";

/**
 * Extrai mensagem de respostas de erro da API (axios / backend padronizado).
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = "Erro ao processar solicitação.") {
  if (axios.isAxiosError(error) && error.request && !error.response) {
    return "Não foi possível contatar o servidor. Confira se a API está rodando.";
  }
  const code = error?.code;
  if (code === "ECONNABORTED" || code === "ERR_NETWORK") {
    return "Sem conexão ou tempo esgotado. Tente novamente.";
  }
  const data = error?.response?.data;
  const apiMsg = data?.message;
  if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg.trim();

  const issues = data?.issues;
  if (Array.isArray(issues) && issues.length) {
    const fromIssues = [...new Set(issues.map((i) => i?.message).filter((m) => typeof m === "string" && m.trim()))].join(
      " ",
    );
    if (fromIssues) return fromIssues;
  }

  if (typeof error?.message === "string" && error.message.trim()) return error.message.trim();
  return fallback;
}
