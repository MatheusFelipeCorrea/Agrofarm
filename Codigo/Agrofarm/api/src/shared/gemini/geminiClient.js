import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../utils/logger.js";

export const MODELOS_GEMINI = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

function normalizarChaveGemini(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/\/\/.*$/, "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
}

export function resolverChaveGeminiInsights() {
  return (
    normalizarChaveGemini(env.GEMINI_API_KEY_INSIGHTS) ||
    normalizarChaveGemini(env.GEMINI_API_KEY_CHATBOT) ||
    normalizarChaveGemini(env.GEMINI_API_KEY)
  );
}

function validarFormatoChaveGemini(chave) {
  if (!chave) return { ok: false, codigo: "vazia" };
  if (!chave.startsWith("AIza")) return { ok: false, codigo: "prefixo", tamanho: chave.length };
  if (chave.length < 35 || chave.length > 45) return { ok: false, codigo: "tamanho", tamanho: chave.length };
  return { ok: true };
}

function erroGeminiEhChaveInvalida(err) {
  const msg = String(err?.message ?? err);
  return msg.includes("API_KEY_INVALID") || msg.includes("API key not valid");
}

function erroGeminiEhCota(err) {
  const msg = String(err?.message ?? err);
  return msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("quota");
}

/**
 * Gera texto com Gemini (insights). Retorna { ok, texto?, motivo? }.
 */
export async function invocarGeminiTexto({ instrucaoSistema, promptUsuario }) {
  const apiKey = resolverChaveGeminiInsights();
  if (!apiKey) return { ok: false, motivo: "sem_chave" };

  const formato = validarFormatoChaveGemini(apiKey);
  if (!formato.ok) return { ok: false, motivo: "chave_formato_invalido", detalhe: formato };

  const genAI = new GoogleGenerativeAI(apiKey);
  let ultimoErro = null;

  for (const nomeModelo of MODELOS_GEMINI) {
    try {
      const model = genAI.getGenerativeModel({
        model: nomeModelo,
        systemInstruction: instrucaoSistema,
      });
      const result = await model.generateContent(promptUsuario);
      const texto = result.response?.text()?.trim();
      if (texto) {
        logger.debug({ modelo: nomeModelo }, "Gemini insights respondeu");
        return { ok: true, texto };
      }
    } catch (err) {
      ultimoErro = err;
      if (erroGeminiEhChaveInvalida(err)) return { ok: false, motivo: "chave_invalida" };
      if (erroGeminiEhCota(err)) {
        logger.warn({ modelo: nomeModelo }, "Cota Gemini insights; tentando próximo modelo");
        continue;
      }
      logger.warn({ modelo: nomeModelo, err: String(err?.message ?? err) }, "Falha Gemini insights");
    }
  }

  if (ultimoErro) logger.error({ err: String(ultimoErro?.message ?? ultimoErro) }, "Gemini insights esgotou modelos");
  return { ok: false, motivo: "modelo_indisponivel" };
}

export function geminiInsightsDisponivel() {
  return validarFormatoChaveGemini(resolverChaveGeminiInsights()).ok;
}
