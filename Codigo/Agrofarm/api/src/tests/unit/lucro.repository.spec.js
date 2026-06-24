import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  lucros: mockModel("findMany", "count", "findUnique", "create", "update", "delete"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { lucroRepository } = await import("../../repositories/lucro.repository.js");
const { prisma } = await import("../../database/client.js");

describe("lucroRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarTodosComFiltros retorna items paginados para admin", async () => {
    const items = [{ id: "l1", origem: "VENDA_COLHEITA" }];
    prisma.lucros.findMany.mockResolvedValue(items);
    prisma.lucros.count.mockResolvedValue(5);

    const result = await lucroRepository.buscarTodosComFiltros({
      role: "ADMIN",
      usuarioId: "admin-1",
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toEqual(items);
    expect(result.meta.totalItems).toBe(5);
    expect(prisma.lucros.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {},
            expect.objectContaining({ origem: "VENDA_COLHEITA" }),
          ]),
        }),
        skip: 0,
        take: 20,
      }),
    );
  });

  it("buscarTotalComFiltros calcula lucro a partir de sacas e valor unitario", async () => {
    prisma.lucros.findMany.mockResolvedValue([
      { quantidade_sacas: 10, valor_unitario: 150 },
      { quantidade_sacas: 5, valor_unitario: 200 },
    ]);

    const result = await lucroRepository.buscarTotalComFiltros({
      role: "ADMIN",
      usuarioId: "admin-1",
    });

    expect(result.totalLucro).toBe(2500);
    expect(prisma.lucros.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { quantidade_sacas: true, valor_unitario: true },
      }),
    );
  });

  it("buscarPorId retorna lucro com includes", async () => {
    const lucro = { id: "l1" };
    prisma.lucros.findUnique.mockResolvedValue(lucro);

    const result = await lucroRepository.buscarPorId("l1");

    expect(result).toEqual(lucro);
    expect(prisma.lucros.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "l1" } }),
    );
  });

  it("create forca origem VENDA_COLHEITA", async () => {
    const dados = { colheita_id: "col-1", quantidade_sacas: 20, valor_unitario: 100 };
    prisma.lucros.create.mockResolvedValue({ id: "l-new", ...dados, origem: "VENDA_COLHEITA" });

    await lucroRepository.create(dados);

    expect(prisma.lucros.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ origem: "VENDA_COLHEITA", colheita_id: "col-1" }),
      }),
    );
  });
});
