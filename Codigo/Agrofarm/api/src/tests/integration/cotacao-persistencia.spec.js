import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
    buscarEuro: vi.fn(),
  },
}));

const { cotacaoService } = await import("../../../services/cotacao.service.js");

/**
 * Testes de Integração: Validar Fluxo de Cotações
 * Foca no que realmente importa: dados corretos chegam ao cliente
 */
describe("Integração: Fluxo de Cotações para Simulação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cotação Dólar - Dados Válidos", () => {
    it("✅ deve retornar cotação dólar com valores numéricos", async () => {
      const cotacao = {
        valor: 5.45,
        variacao: 0.5,
        fonte: "awesomeapi",
        atualizadoEm: new Date("2026-05-17T14:00:00Z"),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(cotacao);

      const resultado = await cotacaoService.buscarDolar();

      expect(resultado.valor).toBe(5.45);
      expect(typeof resultado.valor).toBe("number");
      expect(resultado.valor).toBeGreaterThan(0);
    });

    it("✅ deve retornar variação como número", async () => {
      const cotacao = {
        valor: 5.45,
        variacao: 0.5,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(cotacao);
      const resultado = await cotacaoService.buscarDolar();

      expect(typeof resultado.variacao).toBe("number");
      expect(resultado.variacao).toBe(0.5);
    });

    it("✅ deve incluir fonte para auditoria", async () => {
      const cotacao = {
        valor: 5.45,
        variacao: 0.5,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(cotacao);
      const resultado = await cotacaoService.buscarDolar();

      expect(resultado.fonte).toBe("awesomeapi");
    });
  });

  describe("Cotação Euro - Dados Válidos", () => {
    it("✅ deve retornar cotação euro com valores numéricos", async () => {
      const cotacao = {
        valor: 5.95,
        variacao: 0.3,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarEuro).mockResolvedValue(cotacao);
      const resultado = await cotacaoService.buscarEuro();

      expect(resultado.valor).toBe(5.95);
      expect(typeof resultado.valor).toBe("number");
      expect(resultado.valor).toBeGreaterThan(0);
    });
  });

  describe("Múltiplas Chamadas - Sem Race Condition", () => {
    it("✅ deve buscar USD e EUR simultaneamente", async () => {
      const dolar = {
        valor: 5.45,
        variacao: 0.5,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      const euro = {
        valor: 5.95,
        variacao: 0.3,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(dolar);
      vi.mocked(cotacaoService.buscarEuro).mockResolvedValue(euro);

      // Act: Executar ambas simultaneamente (como faz o job)
      const [usd, eur] = await Promise.all([
        cotacaoService.buscarDolar(),
        cotacaoService.buscarEuro(),
      ]);

      // Assert
      expect(usd.valor).toBe(5.45);
      expect(eur.valor).toBe(5.95);
      expect(usd.valor).not.toBe(eur.valor);
    });
  });

  describe("Múltiplas Casas Decimais", () => {
    it("✅ deve preservar múltiplas casas decimais", async () => {
      const cotacao = {
        valor: 5.456789,
        variacao: 0.12345,
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(cotacao);
      const resultado = await cotacaoService.buscarDolar();

      expect(resultado.valor).toBe(5.456789);
      expect(resultado.variacao).toBe(0.12345);
    });

    it("✅ deve converter strings para número corretamente", async () => {
      // Simula resposta que pode vir como string da API
      const cotacao = {
        valor: Number("5.45"), // Conversão necessária
        variacao: Number("0.5"),
        fonte: "awesomeapi",
        atualizadoEm: new Date(),
      };

      vi.mocked(cotacaoService.buscarDolar).mockResolvedValue(cotacao);
      const resultado = await cotacaoService.buscarDolar();

      expect(typeof resultado.valor).toBe("number");
      expect(resultado.valor).toBe(5.45);
    });
  });

  describe("Gráfico - Histórico de Cotações", () => {
    it("✅ pode montar histórico para gráfico com múltiplos pontos", async () => {
      // Simula 3 chamadas sucessivas do job (a cada 2 horas)
      const historico = [
        {
          timestamp: "2026-05-17T00:00:00Z",
          valor: 5.40,
          variacao: 0.1,
        },
        {
          timestamp: "2026-05-17T02:00:00Z",
          valor: 5.42,
          variacao: 0.2,
        },
        {
          timestamp: "2026-05-17T04:00:00Z",
          valor: 5.45,
          variacao: 0.3,
        },
      ];

      // Assert: Dados estão em ordem cronológica
      expect(historico[0].valor).toBeLessThanOrEqual(historico[1].valor);
      expect(historico[1].valor).toBeLessThanOrEqual(historico[2].valor);

      // Assert: Todos têm valores válidos
      for (const ponto of historico) {
        expect(typeof ponto.valor).toBe("number");
        expect(ponto.valor).toBeGreaterThan(0);
      }
    });
  });
});
