import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/noticia.service.js", () => ({
  noticiaService: {
    listar: vi.fn(),
  },
}));

vi.mock("../../views/noticia.view.js", () => ({
  noticiaView: {
    renderListagem: vi.fn(),
  },
}));

const { noticiaController } = await import("../../controllers/noticia.controller.js");
const { noticiaService } = await import("../../services/noticia.service.js");
const { noticiaView } = await import("../../views/noticia.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("noticiaController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com listagem de notícias", async () => {
    const req = {
      query: { categoria: "mercado", busca: "soja", page: "1", pageSize: "10" },
    };
    const res = createRes();
    const next = vi.fn();

    const serviceResult = { items: [{ id: "n1" }], total: 1 };
    const viewResult = { items: [{ id: "n1", titulo: "Soja em alta" }], total: 1 };

    noticiaService.listar.mockResolvedValue(serviceResult);
    noticiaView.renderListagem.mockReturnValue(viewResult);

    await noticiaController.listar(req, res, next);

    expect(noticiaService.listar).toHaveBeenCalledWith({
      categoria: "mercado",
      busca: "soja",
      page: "1",
      pageSize: "10",
    });
    expect(res.json).toHaveBeenCalledWith({ status: "success", data: viewResult });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de listar para next", async () => {
    const req = { query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    noticiaService.listar.mockRejectedValue(error);

    await noticiaController.listar(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
