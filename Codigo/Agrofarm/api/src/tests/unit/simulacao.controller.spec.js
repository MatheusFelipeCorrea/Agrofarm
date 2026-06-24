import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/simulacao.service.js", () => ({
  simulacaoService: {
    buscarDividas: vi.fn(),
    calcularSacas: vi.fn(),
  },
}));

vi.mock("../../views/simulacao.view.js", () => ({
  simulacaoView: {
    renderDividas: vi.fn(),
    renderCalculo: vi.fn(),
  },
}));

const { simulacaoController } = await import("../../controllers/simulacao.controller.js");
const { simulacaoService } = await import("../../services/simulacao.service.js");
const { simulacaoView } = await import("../../views/simulacao.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("simulacaoController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com dividas simuladas", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { fazendaId: "todas" },
    };
    const res = createRes();
    const next = vi.fn();

    const servicePayload = {
      escopo: { tipo: "todas", fazendaId: "todas" },
      totais: { totalPago: 100, totalPendente: 200, totalGasto: 300 },
    };
    const viewPayload = { totalPago: 100, totalPendente: 200, totalGasto: 300 };

    simulacaoService.buscarDividas.mockResolvedValue(servicePayload);
    simulacaoView.renderDividas.mockReturnValue(viewPayload);

    await simulacaoController.buscarDividas(req, res, next);

    expect(simulacaoService.buscarDividas).toHaveBeenCalledWith({
      usuario: req.usuario,
      fazendaId: "todas",
    });
    expect(simulacaoView.renderDividas).toHaveBeenCalledWith(servicePayload);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: viewPayload });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com calculo da simulacao", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      body: { culturaId: "c1", quantidadeSacas: 10, valorSaca: 100, moeda: "USD" },
    };
    const res = createRes();
    const next = vi.fn();

    const servicePayload = {
      resultado: { valorBruto: 1000, taxasEImpostos: 60, valorLiquido: 940 },
    };
    const viewPayload = {
      resultado: { valorBruto: 1000, taxasEImpostos: 60, valorLiquido: 940 },
    };

    simulacaoService.calcularSacas.mockResolvedValue(servicePayload);
    simulacaoView.renderCalculo.mockReturnValue(viewPayload);

    await simulacaoController.calcularSacas(req, res, next);

    expect(simulacaoService.calcularSacas).toHaveBeenCalledWith({
      usuario: req.usuario,
      payload: req.body,
    });
    expect(simulacaoView.renderCalculo).toHaveBeenCalledWith(servicePayload);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: viewPayload });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de buscarDividas para next", async () => {
    const req = { usuario: { id: "u1" }, query: { fazendaId: "todas" } };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    simulacaoService.buscarDividas.mockRejectedValue(error);

    await simulacaoController.buscarDividas(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("encaminha erro de calcularSacas para next", async () => {
    const req = { usuario: { id: "u1" }, body: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    simulacaoService.calcularSacas.mockRejectedValue(error);

    await simulacaoController.calcularSacas(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
