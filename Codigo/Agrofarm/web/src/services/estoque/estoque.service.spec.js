import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const {
  listarEstoque,
  getEstoqueDetalhe,
  confirmarEntregaArrendamento,
  marcarEntregaArrendamento,
} = await import("./estoque.service.js");

describe("estoque.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarEstoque remove params vazios e retorna data", async () => {
    api.get.mockResolvedValue({
      data: { data: { items: [{ colheitaId: "c1" }] } },
    });

    const resultado = await listarEstoque({
      fazendaId: "",
      status: "DISPONIVEL",
    });

    expect(api.get).toHaveBeenCalledWith("/estoque", {
      params: { status: "DISPONIVEL" },
    });
    expect(resultado.items).toHaveLength(1);
  });

  it("getEstoqueDetalhe busca detalhe por colheitaId", async () => {
    api.get.mockResolvedValue({
      data: { data: { colheitaId: "c1", sacas: 100 } },
    });

    const resultado = await getEstoqueDetalhe("c1");

    expect(api.get).toHaveBeenCalledWith("/estoque/c1");
    expect(resultado.sacas).toBe(100);
  });

  it("confirmarEntregaArrendamento envia PATCH com colheitaId", async () => {
    api.patch.mockResolvedValue({
      data: { data: { id: "e1", confirmada: true } },
    });

    const resultado = await confirmarEntregaArrendamento("e1", "c1");

    expect(api.patch).toHaveBeenCalledWith("/estoque/arrendamento/e1/confirmar", {
      colheitaId: "c1",
    });
    expect(resultado.confirmada).toBe(true);
  });

  it("marcarEntregaArrendamento envia PATCH de status", async () => {
    api.patch.mockResolvedValue({
      data: { data: { id: "e2", status: "ENTREGUE" } },
    });

    const resultado = await marcarEntregaArrendamento("e2", "ENTREGUE");

    expect(api.patch).toHaveBeenCalledWith("/estoque/arrendamento/e2/status", {
      status: "ENTREGUE",
    });
    expect(resultado.status).toBe("ENTREGUE");
  });
});
