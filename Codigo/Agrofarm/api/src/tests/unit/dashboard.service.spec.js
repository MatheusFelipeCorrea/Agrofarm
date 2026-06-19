import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/dashboard.repository.js", () => ({
  dashboardRepository: {
    listarFazendasVisiveis: vi.fn(),
    producaoPorCultura: vi.fn(),
    estoquePorCultura: vi.fn(),
    extratoRecente: vi.fn(),
    totalLucros: vi.fn(),
    totalGastos: vi.fn(),
  },
}));

vi.mock("../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
  },
}));

const { dashboardService } = await import("../../services/dashboard.service.js");
const { dashboardRepository } = await import("../../repositories/dashboard.repository.js");
const { cotacaoService } = await import("../../services/cotacao.service.js");

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna dashboard consolidado para fazenda específica", async () => {
    dashboardRepository.listarFazendasVisiveis.mockResolvedValue([{ id: "faz-1", nome: "Fazenda 1" }]);
    dashboardRepository.producaoPorCultura.mockResolvedValue([
      { culturaId: "c1", nome: "Soja", cor: "#1f8f2f", sacas: 30, area: 2, produtividade: 15 },
      { culturaId: "c2", nome: "Milho", cor: "#eab308", sacas: 10, area: 1, produtividade: 10 },
    ]);
    dashboardRepository.estoquePorCultura.mockResolvedValue([
      { culturaId: "c1", nome: "Soja", cor: "#1f8f2f", peso: 30, dataColheita: new Date("2026-05-01") },
    ]);
    dashboardRepository.extratoRecente.mockResolvedValue([
      { tipo: "LUCRO", valor: 500, data: new Date("2026-05-01"), descricao: "Venda" },
    ]);
    dashboardRepository.totalLucros.mockResolvedValue(500);
    dashboardRepository.totalGastos.mockResolvedValue(100);
    cotacaoService.buscarDolar.mockResolvedValue({ valor: 5.5, fonte: "seed", atualizadoEm: new Date("2026-05-01") });

    const resultado = await dashboardService.obterDados({
      usuario: { id: "u1", role: "ADMIN" },
      filtro: { fazendaId: "faz-1" },
    });

    expect(resultado.cards.saldoTotal).toBe(400);
    expect(resultado.cards.lucroTotal).toBe(500);
    expect(resultado.cards.custosTotais).toBe(100);
    expect(resultado.producaoPorCultura[0]).toEqual(
      expect.objectContaining({ nome: "Soja", produtividade: 15 }),
    );
    expect(dashboardRepository.extratoRecente).toHaveBeenCalledWith({ fazendaIds: ["faz-1"], limite: 24 });
  });

  it("retorna vazio para funcionário sem fazendas ao usar 'todas'", async () => {
    dashboardRepository.listarFazendasVisiveis.mockResolvedValue([]);
    dashboardRepository.producaoPorCultura.mockResolvedValue([]);
    dashboardRepository.estoquePorCultura.mockResolvedValue([]);
    dashboardRepository.extratoRecente.mockResolvedValue([]);
    dashboardRepository.totalLucros.mockResolvedValue(0);
    dashboardRepository.totalGastos.mockResolvedValue(0);
    cotacaoService.buscarDolar.mockResolvedValue(null);

    const resultado = await dashboardService.obterDados({
      usuario: { id: "u2", role: "FUNCIONARIO" },
      filtro: { fazendaId: "todas" },
    });

    expect(resultado.producaoPorCultura).toEqual([]);
    expect(resultado.sacasEmEstoque).toEqual([]);
    expect(resultado.extratoRecente).toEqual([]);
    expect(resultado.cards.saldoTotal).toBe(0);
  });

  it("lança 403 para funcionário tentando acessar fazenda fora do vínculo", async () => {
    dashboardRepository.listarFazendasVisiveis.mockResolvedValue([{ id: "faz-1", nome: "Fazenda 1" }]);

    await expect(
      dashboardService.obterDados({
        usuario: { id: "u3", role: "FUNCIONARIO" },
        filtro: { fazendaId: "faz-999" },
      }),
    ).rejects.toMatchObject({
      message: "Acesso negado a esta fazenda",
      statusCode: 403,
    });
  });
});