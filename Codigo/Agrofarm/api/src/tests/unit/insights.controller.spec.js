import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/insights.service.js", () => ({
  insightsService: {
    buscarInsights: vi.fn(),
    refreshInsight: vi.fn(),
  },
}));

vi.mock("../../views/insights.view.js", () => ({
  insightsView: {
    renderPainel: vi.fn(),
    renderRefresh: vi.fn(),
  },
}));

const { insightsController } = await import("../../controllers/insights.controller.js");
const { insightsService } = await import("../../services/insights.service.js");
const { insightsView } = await import("../../views/insights.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("insightsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com painel de insights para admin", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { fazendaId: "f1" },
    };
    const res = createRes();
    const next = vi.fn();

    const painel = { insights: [{ tipo: "lucro" }] };
    const viewPayload = { insights: [{ tipo: "lucro", renderizado: true }] };

    insightsService.buscarInsights.mockResolvedValue(painel);
    insightsView.renderPainel.mockReturnValue(viewPayload);

    await insightsController.getInsights(req, res, next);

    expect(insightsService.buscarInsights).toHaveBeenCalledWith({
      usuario: req.usuario,
      fazendaId: "f1",
    });
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: viewPayload });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de acesso negado para next quando não é admin", async () => {
    const req = { usuario: { id: "u1", role: "FUNCIONARIO" }, query: {} };
    const res = createRes();
    const next = vi.fn();

    await insightsController.getInsights(req, res, next);

    expect(insightsService.buscarInsights).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Acesso restrito a administradores", statusCode: 403 }),
    );
  });

  it("responde com insight atualizado", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      body: { tipo: "lucro", fazendaId: "f1", fazendaCarouselId: "fc1" },
    };
    const res = createRes();
    const next = vi.fn();

    const resultado = { tipo: "lucro", conteudo: "novo insight" };
    insightsService.refreshInsight.mockResolvedValue(resultado);
    insightsView.renderRefresh.mockReturnValue(resultado);

    await insightsController.refreshInsight(req, res, next);

    expect(insightsService.refreshInsight).toHaveBeenCalledWith({
      usuario: req.usuario,
      tipo: "lucro",
      fazendaId: "f1",
      fazendaCarouselId: "fc1",
    });
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: resultado });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de buscarInsights para next", async () => {
    const req = { usuario: { id: "u1", role: "ADMIN" }, query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    insightsService.buscarInsights.mockRejectedValue(error);

    await insightsController.getInsights(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
