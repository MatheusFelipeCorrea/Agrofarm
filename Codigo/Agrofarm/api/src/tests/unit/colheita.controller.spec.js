import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/colheita.service.js", () => ({
  colheitaService: {
    listar: vi.fn(),
    criar: vi.fn(),
  },
}));

vi.mock("../../views/colheita.view.js", () => ({
  colheitaView: {
    renderMany: vi.fn(),
    render: vi.fn(),
  },
}));

const { colheitaController } = await import("../../controllers/colheita.controller.js");
const { colheitaService } = await import("../../services/colheita.service.js");
const { colheitaView } = await import("../../views/colheita.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("colheitaController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com listagem de colheitas", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { fazendaId: "f1", culturaId: "c1", mes: "6", ano: "2026" },
    };
    const res = createRes();
    const next = vi.fn();

    const colheitas = [{ id: "col-1", quantidade: 100 }];
    colheitaService.listar.mockResolvedValue(colheitas);
    colheitaView.renderMany.mockReturnValue([{ id: "col-1", quantidade: 100 }]);

    await colheitaController.listar(req, res, next);

    expect(colheitaService.listar).toHaveBeenCalledWith({
      usuarioId: "u1",
      role: "ADMIN",
      fazendaId: "f1",
      culturaId: "c1",
      mes: "6",
      ano: "2026",
      from: undefined,
      to: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: [{ id: "col-1", quantidade: 100 }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com colheita criada", async () => {
    const req = {
      usuario: { id: "u1", role: "FUNCIONARIO" },
      body: { fazendaId: "f1", culturaId: "c1", quantidade: 50 },
    };
    const res = createRes();
    const next = vi.fn();

    const colheita = { id: "col-2", quantidade: 50 };
    colheitaService.criar.mockResolvedValue(colheita);
    colheitaView.render.mockReturnValue(colheita);

    await colheitaController.criar(req, res, next);

    expect(colheitaService.criar).toHaveBeenCalledWith({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      payload: req.body,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: colheita });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de listar para next", async () => {
    const req = { usuario: { id: "u1" }, query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    colheitaService.listar.mockRejectedValue(error);

    await colheitaController.listar(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
