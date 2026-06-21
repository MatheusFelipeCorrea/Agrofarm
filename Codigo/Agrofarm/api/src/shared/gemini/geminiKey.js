import { env } from "../../config/env.js";

/** Remove aspas, espaços e comentários acidentais colados na chave do .env. */
export function normalizarChaveGemini(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/\/\/.*$/, "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
}

/** Chave do chatbot; aceita GEMINI_API_KEY_CHATBOT, GEMINI_API_KEY_INSIGHTS ou GEMINI_API_KEY. */
export function resolverChaveGeminiChatbot() {
  return (
    normalizarChaveGemini(env.GEMINI_API_KEY_CHATBOT) ||
    normalizarChaveGemini(env.GEMINI_API_KEY_INSIGHTS) ||
    normalizarChaveGemini(env.GEMINI_API_KEY)
  );
}

export function resolverChaveGeminiInsights() {
  return (
    normalizarChaveGemini(env.GEMINI_API_KEY_INSIGHTS) ||
    normalizarChaveGemini(env.GEMINI_API_KEY_CHATBOT) ||
    normalizarChaveGemini(env.GEMINI_API_KEY)
  );
}

/**
 * Valida formato superficial da chave antes de chamar a API.
 * Google AI Studio usa AIza… (~39 chars); contas mais novas podem emitir AQ.… (~53 chars).
 */
export function validarFormatoChaveGemini(chave) {
  if (!chave) return { ok: false, codigo: "vazia" };

  if (chave.startsWith("AIza")) {
    if (chave.length < 35 || chave.length > 45) {
      return { ok: false, codigo: "tamanho", tamanho: chave.length };
    }
    return { ok: true };
  }

  if (chave.startsWith("AQ.")) {
    if (chave.length < 40 || chave.length > 80) {
      return { ok: false, codigo: "tamanho", tamanho: chave.length };
    }
    return { ok: true };
  }

  return { ok: false, codigo: "prefixo", tamanho: chave.length };
}

export function geminiChatbotDisponivel() {
  return validarFormatoChaveGemini(resolverChaveGeminiChatbot()).ok;
}

export function geminiInsightsDisponivel() {
  return validarFormatoChaveGemini(resolverChaveGeminiInsights()).ok;
}
