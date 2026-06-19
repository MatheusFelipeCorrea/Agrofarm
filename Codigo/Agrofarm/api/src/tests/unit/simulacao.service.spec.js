import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("../../repositories/dashboard.repository.js", () => ({
  dashboardRepository: {
    listarFazendasVisiveis: vi.fn(),
  },
}));

vi.mock("../../repositories/gasto.repository.js", () => ({
  gastoRepository: {
    buscarResumoComFiltros: vi.fn(),
  },
}));

vi.mock("../../services/taxEstimator.service.js", () => ({
  taxEstimatorService: {
    estimarTaxas: vi.fn(),
  },
}));

vi.mock("../../repositories/simulacao.repository.js", () => ({
  simulacaoRepository: {
    buscarCulturaPorId: vi.fn(),
  },
}));

vi.mock("../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
    buscarEuro: vi.fn(),
  },
}));

const axios = (await import("axios")).default;
const { simulacaoService } = await import("../../services/simulacao.service.js");
const { dashboardRepository } = await import("../../repositories/dashboard.repository.js");
const { gastoRepository } = await import("../../repositories/gasto.repository.js");
const { taxEstimatorService } = await import("../../services/taxEstimator.service.js");
const { simulacaoRepository } = await import("../../repositories/simulacao.repository.js");
const { cotacaoService } = await import("../../services/cotacao.service.js");

const ENV_SNAPSHOT = {
  TAX_ESTIMATOR_API_URL: process.env.TAX_ESTIMATOR_API_URL,
  TAX_ESTIMATOR_API_KEY: process.env.TAX_ESTIMATOR_API_KEY,
  TAX_ESTIMATOR_TIMEOUT_MS: process.env.TAX_ESTIMATOR_TIMEOUT_MS,
};

describe("simulacaoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TAX_ESTIMATOR_API_URL;
    delete process.env.TAX_ESTIMATOR_API_KEY;
    delete process.env.TAX_ESTIMATOR_TIMEOUT_MS;

    dashboardRepository.listarFazendasVisiveis.mockResolvedValue([{ id: "faz-1", nome: "Fazenda 1" }]);
    gastoRepository.buscarResumoComFiltros.mockResolvedValue({
      totalPago: 200,
      totalPendente: 800,
      totalGasto: 1000,
    });
    taxEstimatorService.estimarTaxas.mockResolvedValue({
      percentual: 0.06,
      itens: [
        { nome: "Impostos (estimativa)", percentual: 0.03, valor: 30 },
        { nome: "Corretagem", percentual: 0.02, valor: 20 },
        { nome: "Custos logisticos", percentual: 0.01, valor: 10 },
      ],
      valorTotal: 60,
      fonte: "estimativa-interna",
      ncm: null,
      uf: null,
    });
    simulacaoRepository.buscarCulturaPorId.mockResolvedValue({ id: "c1", nome: "Soja" });
    cotacaoService.buscarDolar.mockResolvedValue({ valor: 5.2, atualizadoEm: "2026-05-17T10:00:00.000Z" });
    cotacaoService.buscarEuro.mockResolvedValue({ valor: 6.1, atualizadoEm: "2026-05-17T10:00:00.000Z" });
  });

  afterEach(() => {
    process.env.TAX_ESTIMATOR_API_URL = ENV_SNAPSHOT.TAX_ESTIMATOR_API_URL;
    process.env.TAX_ESTIMATOR_API_KEY = ENV_SNAPSHOT.TAX_ESTIMATOR_API_KEY;
    process.env.TAX_ESTIMATOR_TIMEOUT_MS = ENV_SNAPSHOT.TAX_ESTIMATOR_TIMEOUT_MS;
  });

  it("busca dividas por escopo de fazenda", async () => {
    const resultado = await simulacaoService.buscarDividas({
      usuario: { id: "u1", role: "ADMIN" },
      fazendaId: "faz-1",
    });

    expect(gastoRepository.buscarResumoComFiltros).toHaveBeenCalledWith({
      filters: { fazendaId: "faz-1" },
      role: "ADMIN",
      fazendasPermitidas: [],
    });
    expect(resultado.totais.totalPendente).toBe(800);
    expect(resultado.escopo).toEqual({ tipo: "fazenda", fazendaId: "faz-1" });
  });

  it("bloqueia acesso para nao admin", async () => {
    await expect(
      simulacaoService.buscarDividas({
        usuario: { id: "u2", role: "FUNCIONARIO" },
        fazendaId: "todas",
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Apenas ADMIN pode acessar a Simulação",
    });
  });

  it("calcula simulacao usando contrato externo de taxas no formato data/items", async () => {
    process.env.TAX_ESTIMATOR_API_URL = "https://taxas.externa/mock";
    process.env.TAX_ESTIMATOR_API_KEY = "token-123";
    process.env.TAX_ESTIMATOR_TIMEOUT_MS = "3000";

    axios.post.mockResolvedValue({
      data: {
        data: {
          totalAmount: 120,
          items: [
            { name: "Corretagem", amount: 70, rate: 0.02 },
            { name: "Impostos", amount: 50, rate: 0.03 },
          ],
        },
      },
    });

    const resultado = await simulacaoService.calcularSacas({
      usuario: { id: "u1", role: "ADMIN" },
      payload: {
        culturaId: "c1",
        quantidadeSacas: 10,
        valorSaca: 100,
        moeda: "USD",
        fazendaId: "faz-1",
      },
    });

    expect(axios.post).toHaveBeenCalledWith(
      "https://taxas.externa/mock",
      expect.objectContaining({ cultura: "Soja", valorBruto: 5200, quantidadeSacas: 10, exportacao: true }),
      expect.objectContaining({
        timeout: 3000,
        headers: { Authorization: "Bearer token-123" },
      }),
    );

    expect(resultado.composicaoTaxas.fonte).toBe("api-externa");
    expect(resultado.composicaoTaxas.valorTotal).toBe(120);
    expect(resultado.resultado.taxasEImpostos).toBe(120);
    expect(resultado.resultado.valorBruto).toBe(5200);
    expect(resultado.resultado.valorLiquido).toBe(5080);
    expect(resultado.isExportacao).toBe(true);
  });

  it("usa estimativa interna quando payload externo vem vazio", async () => {
    process.env.TAX_ESTIMATOR_API_URL = "https://taxas.externa/mock";

    axios.post.mockResolvedValue({
      data: {
        resultado: {
          total: 0,
          breakdown: [],
        },
      },
    });

    const resultado = await simulacaoService.calcularSacas({
      usuario: { id: "u1", role: "ADMIN" },
      payload: {
        culturaId: "c1",
        quantidadeSacas: 10,
        valorSaca: 100,
        moeda: "USD",
        fazendaId: "faz-1",
      },
    });

    expect(resultado.composicaoTaxas.fonte).toBe("estimativa-interna");
    expect(resultado.resultado.taxasEImpostos).toBe(60);
    expect(resultado.resultado.valorBruto).toBe(5200);
    expect(resultado.resultado.valorLiquido).toBe(5140);
  });

  it("calcula simulacao de mercado interno sem conversao cambial", async () => {
    const resultado = await simulacaoService.calcularSacas({
      usuario: { id: "u1", role: "ADMIN" },
      payload: {
        culturaId: "c1",
        quantidadeSacas: 10,
        valorSaca: 100,
        isExportacao: false,
        fazendaId: "faz-1",
      },
    });

    expect(cotacaoService.buscarDolar).not.toHaveBeenCalled();
    expect(resultado.isExportacao).toBe(false);
    expect(resultado.cotacao.moeda).toBe("BRL");
    expect(resultado.resultado.valorBruto).toBe(1000);
    expect(resultado.resultado.valorLiquido).toBe(940);
    expect(taxEstimatorService.estimarTaxas).toHaveBeenCalledWith(
      expect.objectContaining({ exportacao: false }),
    );
  });
});
