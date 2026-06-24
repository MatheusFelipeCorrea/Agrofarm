import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/poligono.service.js", () => ({
  poligonoService: {
    buscarPorFazenda: vi.fn(),
    buscarPorId: vi.fn(),
  },
}));

vi.mock("../../services/poligonoHistorico.service.js", () => ({
  poligonoHistoricoService: {
    processarColheitasVencidas: vi.fn(),
  },
}));

vi.mock("../../shared/utils/logger.js", () => ({
  logger: { error: vi.fn() },
}));

const { poligonoController } = await import("../../controllers/poligono.controller.js");
const { poligonoService } = await import("../../services/poligono.service.js");
const { poligonoHistoricoService } = await import("../../services/poligonoHistorico.service.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("poligonoController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com polígonos da fazenda", async () => {
    const req = { query: { fazendaId: "f1" } };
    const res = createRes();
    const next = vi.fn();

    const poligonos = [{ id: "p1", nome: "Talhão 1" }];
    poligonoHistoricoService.processarColheitasVencidas.mockResolvedValue({ processados: 2 });
    poligonoService.buscarPorFazenda.mockResolvedValue(poligonos);

    await poligonoController.listar(req, res, next);

    expect(poligonoHistoricoService.processarColheitasVencidas).toHaveBeenCalledWith("f1");
    expect(poligonoService.buscarPorFazenda).toHaveBeenCalledWith("f1");
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: poligonos,
      meta: { colheitasArquivadas: 2 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde com polígono por id", async () => {
    const req = { params: { id: "p1" } };
    const res = createRes();
    const next = vi.fn();

    const poligono = { id: "p1", nome: "Talhão 1" };
    poligonoService.buscarPorId.mockResolvedValue(poligono);

    await poligonoController.buscarPorId(req, res, next);

    expect(poligonoService.buscarPorId).toHaveBeenCalledWith("p1");
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: poligono });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro quando fazendaId está ausente", async () => {
    const req = { query: {} };
    const res = createRes();
    const next = vi.fn();

    await poligonoController.listar(req, res, next);

    expect(poligonoService.buscarPorFazenda).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "fazendaId é obrigatório", statusCode: 400 }),
    );
  });

  it("encaminha erro de buscarPorId para next", async () => {
    const req = { params: { id: "p1" } };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    poligonoService.buscarPorId.mockRejectedValue(error);

    await poligonoController.buscarPorId(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
