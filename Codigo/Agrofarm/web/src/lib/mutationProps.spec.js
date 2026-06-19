import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./notify.js", () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const { notify } = await import("./notify.js");
const { apiErrorToast, apiSuccessToast } = await import("./mutationProps.js");

describe("mutationProps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("apiErrorToast exibe mensagem da API", () => {
    const handlers = apiErrorToast("Falha ao salvar");
    handlers.onError({ response: { data: { message: "Colheita inválida" } } });

    expect(notify.error).toHaveBeenCalledWith("Colheita inválida");
  });

  it("apiSuccessToast dispara notify.success", () => {
    const handlers = apiSuccessToast("Salvo com sucesso");
    handlers.onSuccess();

    expect(notify.success).toHaveBeenCalledWith("Salvo com sucesso", {});
  });
});
