import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const { listGastos, createGasto, deleteGasto } = await import("./gasto.service.js");

describe("gasto.service (web)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listGastos remove params vazios e retorna data", async () => {
    api.get.mockResolvedValue({
      data: { data: { items: [{ id: "g1" }], totals: {}, meta: {} } },
    });

    const resultado = await listGastos({
      fazendaId: "",
      culturaId: undefined,
      status: "PAGO",
    });

    expect(api.get).toHaveBeenCalledWith("/gastos", {
      params: { status: "PAGO" },
    });
    expect(resultado.items).toHaveLength(1);
  });

  it("createGasto envia POST e retorna registro", async () => {
    api.post.mockResolvedValue({ data: { data: { id: "g2" } } });

    const resultado = await createGasto({
      colheitaId: "col-1",
      tipo: "ADUBO",
      valor: 100,
      data: "2026-05-01",
      status: "PAGO",
    });

    expect(api.post).toHaveBeenCalledWith("/gastos", expect.objectContaining({ tipo: "ADUBO" }));
    expect(resultado.id).toBe("g2");
  });

  it("deleteGasto chama DELETE", async () => {
    api.delete.mockResolvedValue({});

    await deleteGasto("gasto-1");

    expect(api.delete).toHaveBeenCalledWith("/gastos/gasto-1");
  });
});
