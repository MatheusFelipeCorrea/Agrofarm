import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const { listarNoticias } = await import("./noticia.service.js");

describe("noticia.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarNoticias remove params vazios e retorna data.data", async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: "n1", titulo: "Notícia" }] },
    });

    const resultado = await listarNoticias({
      page: 1,
      busca: "",
      categoria: undefined,
    });

    expect(api.get).toHaveBeenCalledWith("/noticias", {
      params: { page: 1 },
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("n1");
  });

  it("listarNoticias retorna data diretamente quando data.data é ausente", async () => {
    api.get.mockResolvedValue({
      data: [{ id: "n2" }],
    });

    const resultado = await listarNoticias();

    expect(resultado).toEqual([{ id: "n2" }]);
  });
});
