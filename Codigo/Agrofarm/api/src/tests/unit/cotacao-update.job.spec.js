import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
    buscarEuro: vi.fn(),
  },
}));

vi.mock("../../shared/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { executarAtualizacaoCotacoes, iniciarJobAtualizacaoCotacoes, pararJobAtualizacaoCotacoes } =
  await import("../../jobs/cotacao-update.job.js");
const { cotacaoService } = await import("../../services/cotacao.service.js");
const { logger } = await import("../../shared/utils/logger.js");

describe("cotacao-update.job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pararJobAtualizacaoCotacoes();
  });

  describe("executarAtualizacaoCotacoes", () => {
    it("deve buscar dólar e euro e retornar resultado com sucesso", async () => {
      const dolarMock = {
        valor: 5.45,
        variacao: 0.5,
        fonte: "awesomeapi",
        atualizadoEm: "2026-05-17T14:00:00.000Z",
      };

      const euroMock = {
        valor: 5.95,
        variacao: 0.3,
        fonte: "awesomeapi",
        atualizadoEm: "2026-05-17T14:00:00.000Z",
      };

      cotacaoService.buscarDolar.mockResolvedValue(dolarMock);
      cotacaoService.buscarEuro.mockResolvedValue(euroMock);

      const resultado = await executarAtualizacaoCotacoes();

      expect(cotacaoService.buscarDolar).toHaveBeenCalled();
      expect(cotacaoService.buscarEuro).toHaveBeenCalled();
      expect(resultado.dolar.status).toBe("fulfilled");
      expect(resultado.euro.status).toBe("fulfilled");
      expect(resultado.dolar.valor).toBe(5.45);
      expect(resultado.euro.valor).toBe(5.95);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          dolar: expect.objectContaining({ status: "fulfilled" }),
          euro: expect.objectContaining({ status: "fulfilled" }),
        }),
        expect.stringContaining("✅"),
      );
    });

    it("deve retornar aviso quando dólar falha mas euro funciona", async () => {
      const euroMock = {
        valor: 5.95,
        variacao: 0.3,
        fonte: "awesomeapi",
        atualizadoEm: "2026-05-17T14:00:00.000Z",
      };

      cotacaoService.buscarDolar.mockRejectedValue(new Error("API offline"));
      cotacaoService.buscarEuro.mockResolvedValue(euroMock);

      const resultado = await executarAtualizacaoCotacoes();

      expect(resultado.dolar.status).toBe("rejected");
      expect(resultado.euro.status).toBe("fulfilled");
      expect(resultado.dolar.erro).toBe("API offline");
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          dolar: expect.objectContaining({ status: "rejected" }),
          euro: expect.objectContaining({ status: "fulfilled" }),
        }),
        expect.stringContaining("⚠️"),
      );
    });

    it("deve retornar erro quando ambas as chamadas falham", async () => {
      cotacaoService.buscarDolar.mockRejectedValue(new Error("API offline"));
      cotacaoService.buscarEuro.mockRejectedValue(new Error("API offline"));

      const resultado = await executarAtualizacaoCotacoes();

      expect(resultado.dolar.status).toBe("rejected");
      expect(resultado.euro.status).toBe("rejected");
      expect(resultado.dolar.erro).toBe("API offline");
      expect(resultado.euro.erro).toBe("API offline");
    });

    it("deve registrar timestamp correto em cada execução", async () => {
      cotacaoService.buscarDolar.mockResolvedValue({ valor: 5.45 });
      cotacaoService.buscarEuro.mockResolvedValue({ valor: 5.95 });

      const resultado = await executarAtualizacaoCotacoes();

      expect(resultado.timestamp).toBeDefined();
      expect(typeof resultado.timestamp).toBe("string");
      // Timestamp deve estar em formato ISO
      expect(resultado.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("iniciarJobAtualizacaoCotacoes", () => {
    it("deve registrar que o job foi iniciado", () => {
      iniciarJobAtualizacaoCotacoes();

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          cron: expect.any(String),
          timezone: expect.any(String),
          proximo: expect.stringContaining("2 horas"),
        }),
        expect.stringContaining("✅"),
      );
    });

    it("não deve iniciar o job duas vezes", () => {
      vi.clearAllMocks();

      iniciarJobAtualizacaoCotacoes();

      iniciarJobAtualizacaoCotacoes();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("já está iniciado"),
      );
    });
  });
});
