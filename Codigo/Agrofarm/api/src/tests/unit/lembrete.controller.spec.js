import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/lembrete.service.js", () => ({
  lembreteService: {
    listarTodos: vi.fn(),
    criar: vi.fn(),
    remover: vi.fn(),
  },
}));

vi.mock("../../views/lembrete.view.js", () => ({
  lembreteView: {
    renderMany: vi.fn(),
    render: vi.fn(),
  },
}));

const { lembreteController } = await import("../../controllers/lembrete.controller.js");
const { lembreteService } = await import("../../services/lembrete.service.js");
const { lembreteView } = await import("../../views/lembrete.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("lembreteController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com listagem de lembretes", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { fazendaId: "f1", status: "PENDENTE" },
    };
    const res = createRes();
    const next = vi.fn();

    const lembretes = [{ id: "l1", titulo: "Plantio" }];
    lembreteService.listarTodos.mockResolvedValue(lembretes);
    lembreteView.renderMany.mockReturnValue([{ id: "l1", titulo: "Plantio" }]);

    await lembreteController.listar(req, res, next);

    expect(lembreteService.listarTodos).toHaveBeenCalledWith({
      fazendaId: "f1",
      status: "PENDENTE",
      usuario: req.usuario,
    });
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: [{ id: "l1", titulo: "Plantio" }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com lembrete criado", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      body: { titulo: "Colheita", data: "2026-06-24" },
    };
    const res = createRes();
    const next = vi.fn();

    const lembrete = { id: "l2", titulo: "Colheita" };
    lembreteService.criar.mockResolvedValue(lembrete);
    lembreteView.render.mockReturnValue(lembrete);

    await lembreteController.criar(req, res, next);

    expect(lembreteService.criar).toHaveBeenCalledWith({
      titulo: "Colheita",
      data: "2026-06-24",
      usuarioId: "u1",
      usuario: req.usuario,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: lembrete });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de listar para next", async () => {
    const req = { usuario: { id: "u1" }, query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    lembreteService.listarTodos.mockRejectedValue(error);

    await lembreteController.listar(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
