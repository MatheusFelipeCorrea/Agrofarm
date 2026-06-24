import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/notificacao.service.js", () => ({
  notificacaoService: {
    listarParaUsuario: vi.fn(),
    marcarComoLida: vi.fn(),
  },
}));

vi.mock("../../views/notificacao.view.js", () => ({
  notificacaoView: {
    renderMany: vi.fn(),
  },
}));

const { notificacaoController } = await import("../../controllers/notificacao.controller.js");
const { notificacaoService } = await import("../../services/notificacao.service.js");
const { notificacaoView } = await import("../../views/notificacao.view.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("notificacaoController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com notificações do usuário", async () => {
    const req = {
      usuario: { id: "u1", role: "ADMIN" },
      query: { limit: "10" },
    };
    const res = createRes();
    const next = vi.fn();

    const items = [{ id: "n1", lida: false }];
    notificacaoService.listarParaUsuario.mockResolvedValue({
      items,
      unreadCount: 1,
      unreadMarcaveis: 1,
    });
    notificacaoView.renderMany.mockReturnValue([{ id: "n1", lida: false }]);

    await notificacaoController.listar(req, res, next);

    expect(notificacaoService.listarParaUsuario).toHaveBeenCalledWith({
      usuario: req.usuario,
      limit: "10",
    });
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: {
        items: [{ id: "n1", lida: false }],
        unreadCount: 1,
        unreadMarcaveis: 1,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("marca notificação como lida com 204", async () => {
    const req = {
      usuario: { id: "u1" },
      params: { id: "n1" },
    };
    const res = createRes();
    const next = vi.fn();

    notificacaoService.marcarComoLida.mockResolvedValue(undefined);

    await notificacaoController.marcarComoLida(req, res, next);

    expect(notificacaoService.marcarComoLida).toHaveBeenCalledWith({
      usuario: req.usuario,
      notificacaoId: "n1",
    });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro de listar para next", async () => {
    const req = { usuario: { id: "u1" }, query: {} };
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    notificacaoService.listarParaUsuario.mockRejectedValue(error);

    await notificacaoController.listar(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
