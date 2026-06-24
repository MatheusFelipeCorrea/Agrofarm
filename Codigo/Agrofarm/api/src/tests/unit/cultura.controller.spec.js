import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/cultura.service.js", () => ({
  culturaService: {
    listarTodas: vi.fn(),
    criar: vi.fn(),
  },
}));

vi.mock("../../views/cultura.view.js", () => ({
  culturaView: {
    renderMany: vi.fn(),
    render: vi.fn(),
  },
}));

const { culturaController } = await import("../../controllers/cultura.controller.js");
const { culturaService } = await import("../../services/cultura.service.js");
const { culturaView } = await import("../../views/cultura.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("culturaController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com todas as culturas", async () => {
    const req = {};
    const res = createRes();
    const next = vi.fn();

    const culturas = [{ id: "c1", nome: "Soja" }];
    culturaService.listarTodas.mockResolvedValue(culturas);
    culturaView.renderMany.mockReturnValue([{ id: "c1", nome: "Soja" }]);

    await culturaController.getAll(req, res, next);

    expect(culturaService.listarTodas).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      culturas: [{ id: "c1", nome: "Soja" }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com cultura criada", async () => {
    const req = { body: { nome: "Milho", ncm: "10059000" } };
    const res = createRes();
    const next = vi.fn();

    const cultura = { id: "c2", nome: "Milho" };
    culturaService.criar.mockResolvedValue(cultura);
    culturaView.render.mockReturnValue(cultura);

    await culturaController.create(req, res, next);

    expect(culturaService.criar).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ cultura });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de getAll para next", async () => {
    const req = {};
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    culturaService.listarTodas.mockRejectedValue(error);

    await culturaController.getAll(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
