import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
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

vi.mock("../../repositories/lucro.repository.js", () => ({
  lucroRepository: {
    buscarTotalComFiltros: vi.fn(),
  },
}));

vi.mock("../../repositories/simulacao.repository.js", () => ({
  simulacaoRepository: {
    buscarCulturaPorId: vi.fn(),
    listarPorUsuario: vi.fn(),
  },
}));

vi.mock("../../services/taxEstimator.service.js", () => ({
  taxEstimatorService: {
    estimarTaxas: vi.fn(),
  },
}));

vi.mock("../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
    buscarEuro: vi.fn(),
  },
}));

const { simulacaoService } = await import("../../services/simulacao.service.js");
const { cotacaoService } = await import("../../services/cotacao.service.js");
const { dashboardRepository } = await import("../../repositories/dashboard.repository.js");
const { gastoRepository } = await import("../../repositories/gasto.repository.js");
const { lucroRepository } = await import("../../repositories/lucro.repository.js");
const { simulacaoRepository } = await import("../../repositories/simulacao.repository.js");
const { taxEstimatorService } = await import("../../services/taxEstimator.service.js");

describe("Integração: Simulação + Cotação", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dashboardRepository.listarFazendasVisiveis.mockResolvedValue([
      { id: "fazenda-456", nome: "Fazenda A" },
    ]);
    gastoRepository.buscarResumoComFiltros.mockResolvedValue({
      totalPago: 100,
      totalPendente: 900,
      totalGasto: 1000,
    });
    lucroRepository.buscarTotalComFiltros.mockResolvedValue({
      totalLucro: 500,
    });
    taxEstimatorService.estimarTaxas.mockResolvedValue({
      percentual: 0.05,
      itens: [{ nome: "Impostos", percentual: 0.05, valor: 50 }],
      valorTotal: 50,
      fonte: "estimativa-interna",
    });
    simulacaoRepository.buscarCulturaPorId.mockResolvedValue({ id: "c1", nome: "Soja" });
    cotacaoService.buscarDolar.mockResolvedValue({
      valor: 5.45,
      variacao: 0.5,
      fonte: "awesomeapi",
      atualizadoEm: "2026-05-17T14:00:00Z",
    });
  });

  it("usa cotação do serviço ao calcular sacas", async () => {
    const resultado = await simulacaoService.calcularSacas({
      usuario: { id: "admin-1", role: "ADMIN" },
      payload: {
        fazendaId: "fazenda-456",
        culturaId: "c1",
        quantidadeSacas: 10,
        valorSaca: 100,
        moeda: "USD",
      },
    });

    expect(cotacaoService.buscarDolar).toHaveBeenCalledTimes(1);
    expect(resultado.cotacao.valorAtual).toBe(5.45);
    expect(resultado.resultado.valorBruto).toBeGreaterThan(0);
  });

  it("retorna dívidas consolidadas por escopo de fazenda", async () => {
    const dividas = await simulacaoService.buscarDividas({
      usuario: { id: "admin-1", role: "ADMIN" },
      fazendaId: "fazenda-456",
    });

    expect(gastoRepository.buscarResumoComFiltros).toHaveBeenCalledWith({
      filters: { fazendaId: "fazenda-456" },
      role: "ADMIN",
      fazendasPermitidas: [],
    });
    expect(dividas.totais.totalPendente).toBe(900);
    expect(dividas.escopo).toEqual({ tipo: "fazenda", fazendaId: "fazenda-456" });
  });

  it("lista histórico de simulações para admin", async () => {
    simulacaoRepository.listarPorUsuario.mockResolvedValue([
      { id: "sim-1", valor_bruto: 1000 },
      { id: "sim-2", valor_bruto: 1200 },
    ]);

    const historico = await simulacaoService.buscarHistorico({
      usuario: { id: "admin-1", role: "ADMIN" },
      fazendaId: "todas",
      limite: 10,
    });

    expect(simulacaoRepository.listarPorUsuario).toHaveBeenCalledWith({
      usuarioId: "admin-1",
      fazendaId: "todas",
      limite: 10,
    });
    expect(historico).toHaveLength(2);
  });
});
