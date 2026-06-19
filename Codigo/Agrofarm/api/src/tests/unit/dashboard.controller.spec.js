import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/dashboard.service.js", () => ({
  dashboardService: {
    obterDados: vi.fn(),
  },
}));

const { dashboardController } = await import("../../controllers/dashboard.controller.js");
const { dashboardService } = await import("../../services/dashboard.service.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("dashboardController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com payload do dashboard", async () => {
    const req = {
      usuario: { id: "user-1", role: "ADMIN" },
      query: { fazendaId: "todas" },
    };
    const res = createRes();
    const next = vi.fn();

    dashboardService.obterDados.mockResolvedValue({
      recomendacao: null,
      producaoPorCultura: [],
      sacasEmEstoque: [],
      extratoRecente: [],
      cards: { saldoTotal: 0, cotacaoAtual: null, lucroTotal: 0, custosTotais: 0 },
    });

    await dashboardController.getDados(req, res, next);

    expect(dashboardService.obterDados).toHaveBeenCalledWith({
      usuario: req.usuario,
      filtro: req.query,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro para next", async () => {
    const req = { usuario: { id: "user-1" }, query: { fazendaId: "todas" } };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    dashboardService.obterDados.mockRejectedValue(error);

    await dashboardController.getDados(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});