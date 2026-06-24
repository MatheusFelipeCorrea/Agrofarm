import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";
import {
  geminiInsightsDisponivel,
  resolverChaveGeminiInsights,
  validarFormatoChaveGemini,
} from "./geminiKey.js";

export const MODELOS_GEMINI = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

export { geminiInsightsDisponivel, resolverChaveGeminiInsights } from "./geminiKey.js";

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
