import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockEnv, mockGenerateContent, mockGetGenerativeModel, mockGoogleGenerativeAI } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  const mockGoogleGenerativeAI = vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));
  return {
    mockEnv: {
      GEMINI_API_KEY: "",
      GEMINI_API_KEY_CHATBOT: "",
      GEMINI_API_KEY_INSIGHTS: "",
    },
    mockGenerateContent,
    mockGetGenerativeModel,
    mockGoogleGenerativeAI,
  };
});

vi.mock("../../config/env.js", () => ({
  env: mockEnv,
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

vi.mock("../../shared/utils/logger.js", () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  normalizarChaveGemini,
  resolverChaveGeminiChatbot,
  resolverChaveGeminiInsights,
  validarFormatoChaveGemini,
  geminiChatbotDisponivel,
  geminiInsightsDisponivel,
} from "../../shared/gemini/geminiKey.js";
import { invocarGeminiTexto, MODELOS_GEMINI } from "../../shared/gemini/geminiClient.js";

const CHAVE_VALIDA = "AIzaSyD1234567890123456789012345678901";

describe("geminiKey", () => {
  beforeEach(() => {
    mockEnv.GEMINI_API_KEY = "";
    mockEnv.GEMINI_API_KEY_CHATBOT = "";
    mockEnv.GEMINI_API_KEY_INSIGHTS = "";
  });

  it("normalizarChaveGemini remove aspas, espacos e comentarios", () => {
    expect(normalizarChaveGemini('  "AIzaSyD123" // comentario  ')).toBe("AIzaSyD123");
    expect(normalizarChaveGemini(null)).toBe("");
  });

  it("resolverChaveGeminiChatbot prioriza CHATBOT > INSIGHTS > GEMINI", () => {
    mockEnv.GEMINI_API_KEY = "chave-geral";
    mockEnv.GEMINI_API_KEY_INSIGHTS = "chave-insights";
    mockEnv.GEMINI_API_KEY_CHATBOT = "chave-chatbot";
    expect(resolverChaveGeminiChatbot()).toBe("chave-chatbot");

    mockEnv.GEMINI_API_KEY_CHATBOT = "";
    expect(resolverChaveGeminiChatbot()).toBe("chave-insights");
  });

  it("resolverChaveGeminiInsights prioriza INSIGHTS > CHATBOT > GEMINI", () => {
    mockEnv.GEMINI_API_KEY = "chave-geral";
    mockEnv.GEMINI_API_KEY_INSIGHTS = "chave-insights";
    mockEnv.GEMINI_API_KEY_CHATBOT = "chave-chatbot";
    expect(resolverChaveGeminiInsights()).toBe("chave-insights");

    mockEnv.GEMINI_API_KEY_INSIGHTS = "";
    expect(resolverChaveGeminiInsights()).toBe("chave-chatbot");
  });

  it("validarFormatoChaveGemini aceita AIza e AQ.", () => {
    expect(validarFormatoChaveGemini("")).toEqual({ ok: false, codigo: "vazia" });
    expect(validarFormatoChaveGemini(CHAVE_VALIDA).ok).toBe(true);
    expect(validarFormatoChaveGemini("AQ.AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr").ok).toBe(true);
    expect(validarFormatoChaveGemini("invalida").codigo).toBe("prefixo");
    expect(validarFormatoChaveGemini("AIzaCurta").codigo).toBe("tamanho");
  });

  it("geminiChatbotDisponivel e geminiInsightsDisponivel refletem formato valido", () => {
    mockEnv.GEMINI_API_KEY_CHATBOT = CHAVE_VALIDA;
    expect(geminiChatbotDisponivel()).toBe(true);

    mockEnv.GEMINI_API_KEY_INSIGHTS = CHAVE_VALIDA;
    expect(geminiInsightsDisponivel()).toBe(true);

    mockEnv.GEMINI_API_KEY_INSIGHTS = "invalida";
    expect(geminiInsightsDisponivel()).toBe(false);
  });
});

describe("geminiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.GEMINI_API_KEY = "";
    mockEnv.GEMINI_API_KEY_CHATBOT = "";
    mockEnv.GEMINI_API_KEY_INSIGHTS = CHAVE_VALIDA;
  });

  it("exporta MODELOS_GEMINI", () => {
    expect(MODELOS_GEMINI).toContain("gemini-2.5-flash");
  });

  it("invocarGeminiTexto retorna sem_chave quando nao ha api key", async () => {
    mockEnv.GEMINI_API_KEY_INSIGHTS = "";
    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado).toEqual({ ok: false, motivo: "sem_chave" });
  });

  it("invocarGeminiTexto retorna chave_formato_invalido", async () => {
    mockEnv.GEMINI_API_KEY_INSIGHTS = "chave-invalida";
    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toBe("chave_formato_invalido");
  });

  it("invocarGeminiTexto retorna texto quando modelo responde", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "  Resposta Gemini  " },
    });
    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado).toEqual({ ok: true, texto: "Resposta Gemini" });
    expect(mockGoogleGenerativeAI).toHaveBeenCalledWith(CHAVE_VALIDA);
  });

  it("invocarGeminiTexto retorna chave_invalida em erro de API key", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API_KEY_INVALID"));
    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado).toEqual({ ok: false, motivo: "chave_invalida" });
  });

  it("invocarGeminiTexto tenta proximo modelo em erro de cota", async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error("429 Too Many Requests quota"))
      .mockResolvedValueOnce({ response: { text: () => "ok" } });

    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado).toEqual({ ok: true, texto: "ok" });
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
  });

  it("invocarGeminiTexto retorna modelo_indisponivel quando todos falham", async () => {
    mockGenerateContent.mockRejectedValue(new Error("network down"));
    const resultado = await invocarGeminiTexto({ instrucaoSistema: "sys", promptUsuario: "oi" });
    expect(resultado).toEqual({ ok: false, motivo: "modelo_indisponivel" });
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(MODELOS_GEMINI.length);
  });
});
