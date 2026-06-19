import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/cotacao.service.js", () => ({
  cotacaoService: {
    buscarDolar: vi.fn(),
  },
}));

const { cotacaoController } = await import("../../controllers/cotacao.controller.js");
const { cotacaoService } = await import("../../services/cotacao.service.js");

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("cotacaoController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde com a cotação do dólar", async () => {
    const res = createRes();
    const next = vi.fn();

    cotacaoService.buscarDolar.mockResolvedValue({ valor: "5.42", fonte: "stub" });

    await cotacaoController.getDolar({}, res, next);

    expect(cotacaoService.buscarDolar).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ valor: "5.42", fonte: "stub" });
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erro para next", async () => {
    const res = createRes();
    const next = vi.fn();
    const error = new Error("falhou");

    cotacaoService.buscarDolar.mockRejectedValue(error);

    await cotacaoController.getDolar({}, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});