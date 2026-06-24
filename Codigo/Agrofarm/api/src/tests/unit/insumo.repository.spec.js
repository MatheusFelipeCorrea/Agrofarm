import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  insumos_atividades: mockModel("findMany", "count", "findFirst", "create", "update", "delete"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { insumoRepository } = await import("../../repositories/insumo.repository.js");
const { prisma } = await import("../../database/client.js");

describe("insumoRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listar retorna items, totais e meta paginada", async () => {
    const items = [{ id: "i1", quantidade: 2, valor_unitario: 50 }];
    prisma.insumos_atividades.findMany
      .mockResolvedValueOnce(items)
      .mockResolvedValueOnce([{ quantidade: 2, valor_unitario: 50 }])
      .mockResolvedValueOnce([{ item: "Adubo" }]);
    prisma.insumos_atividades.count.mockResolvedValue(1);

    const result = await insumoRepository.listar({
      role: "ADMIN",
      usuarioId: "admin-1",
      fazendaIdsPermitidas: [],
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toEqual(items);
    expect(result.totals).toEqual({ totalConsumo: 100, totalQuantidade: 2, totalRegistros: 1 });
    expect(result.meta.totalItems).toBe(1);
    expect(result.itensDisponiveis).toEqual(["Adubo"]);
    expect(prisma.insumos_atividades.count).toHaveBeenCalledOnce();
  });

  it("criar associa funcionario e dados do payload", async () => {
    const data = {
      fazenda_id: "faz-1",
      item: "Herbicida",
      categoria: "DEFENSIVO",
      quantidade: 5,
      unidade: "L",
      valor_unitario: 30,
      data: new Date("2026-06-01"),
    };
    prisma.insumos_atividades.create.mockResolvedValue({ id: "i-new", ...data });

    const result = await insumoRepository.criar({ usuarioId: "u1", data });

    expect(result.id).toBe("i-new");
    expect(prisma.insumos_atividades.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          funcionario_id: "u1",
          fazenda_id: "faz-1",
          item: "Herbicida",
        }),
      }),
    );
  });

  it("remover retorna null quando registro nao esta no escopo", async () => {
    prisma.insumos_atividades.findFirst.mockResolvedValue(null);

    const result = await insumoRepository.remover({
      role: "FUNCIONARIO",
      usuarioId: "u1",
      fazendaIdsPermitidas: ["faz-1"],
      id: "i-missing",
    });

    expect(result).toBeNull();
    expect(prisma.insumos_atividades.delete).not.toHaveBeenCalled();
  });

  it("remover exclui quando registro existe no escopo", async () => {
    prisma.insumos_atividades.findFirst.mockResolvedValue({ id: "i1" });
    prisma.insumos_atividades.delete.mockResolvedValue({ id: "i1" });

    const result = await insumoRepository.remover({
      role: "ADMIN",
      usuarioId: "admin-1",
      fazendaIdsPermitidas: [],
      id: "i1",
    });

    expect(result).toBe(true);
    expect(prisma.insumos_atividades.delete).toHaveBeenCalledWith({ where: { id: "i1" } });
  });
});
