import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/estoque.service.js", () => ({
  estoqueService: {
    listar: vi.fn(),
    buscarDetalhe: vi.fn(),
  },
}));

vi.mock("../../views/estoque.view.js", () => ({
  estoqueView: {
    renderMany: vi.fn(),
    renderResumo: vi.fn(),
    renderMovimentacoesRecentes: vi.fn(),
    renderArrendamentosPendentes: vi.fn(),
    renderDetalhe: vi.fn(),
  },
}));

const { estoqueController } = await import("../../controllers/estoque.controller.js");
const { estoqueService } = await import("../../services/estoque.service.js");
const { estoqueView } = await import("../../views/estoque.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("estoqueController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com listagem de estoque", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { fazendaId: "f1" },
    };
    const res = createRes();
    const next = vi.fn();

    const serviceResult = {
      items: [{ id: "c1" }],
      resumo: { total: 100 },
      movimentacoesRecentes: [],
      arrendamentosPendentes: [],
      meta: { page: 1 },
    };

    estoqueService.listar.mockResolvedValue(serviceResult);
    estoqueView.renderMany.mockReturnValue([{ id: "c1", renderizado: true }]);
    estoqueView.renderResumo.mockReturnValue({ total: 100 });
    estoqueView.renderMovimentacoesRecentes.mockReturnValue([]);
    estoqueView.renderArrendamentosPendentes.mockReturnValue([]);

    await estoqueController.listar(req, res, next);

    expect(estoqueService.listar).toHaveBeenCalledWith({
      usuarioId: "u1",
      role: "ADMIN",
      query: req.query,
    });
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: {
        items: [{ id: "c1", renderizado: true }],
        resumo: { total: 100 },
        movimentacoesRecentes: [],
        arrendamentosPendentes: [],
        meta: { page: 1 },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com detalhe do estoque", async () => {
    const req = {
      usuario: { id: "u1", role: "FUNCIONARIO" },
      params: { colheitaId: "col-1" },
    };
    const res = createRes();
    const next = vi.fn();

    const detalhe = { id: "col-1", quantidade: 50 };
    estoqueService.buscarDetalhe.mockResolvedValue(detalhe);
    estoqueView.renderDetalhe.mockReturnValue({ id: "col-1", quantidade: 50 });

    await estoqueController.getDetalhe(req, res, next);

    expect(estoqueService.buscarDetalhe).toHaveBeenCalledWith({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      colheitaId: "col-1",
    });
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: { id: "col-1", quantidade: 50 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de listar para next", async () => {
    const req = { usuario: { id: "u1" }, query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    estoqueService.listar.mockRejectedValue(error);

    await estoqueController.listar(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
