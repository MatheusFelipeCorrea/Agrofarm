import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  colheitas: mockModel("findMany", "findFirst", "create", "update", "delete"),
  usuarios_fazendas: mockModel("findFirst"),
  gastos: mockModel("count"),
  lucros: mockModel("count"),
  $transaction: vi.fn(),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { colheitaRepository } = await import("../../repositories/colheita.repository.js");
const { prisma } = await import("../../database/client.js");

describe("colheitaRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarTodosComFiltros lista colheitas para admin com filtro de fazenda", async () => {
    const rows = [{ id: "c1", fazenda_id: "faz-1" }];
    prisma.colheitas.findMany.mockResolvedValue(rows);

    const result = await colheitaRepository.buscarTodosComFiltros({
      fazendaId: "faz-1",
      role: "ADMIN",
      fazendaIdsPermitidas: [],
    });

    expect(result).toEqual(rows);
    expect(prisma.colheitas.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ fazenda_id: "faz-1" }),
      }),
    );
  });

  it("buscarPorId restringe fazendas permitidas para funcionario", async () => {
    prisma.colheitas.findFirst.mockResolvedValue({ id: "c1" });

    await colheitaRepository.buscarPorId({
      role: "FUNCIONARIO",
      id: "c1",
      fazendaIdsPermitidas: ["faz-1", "faz-2"],
    });

    expect(prisma.colheitas.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "c1",
          fazenda_id: { in: ["faz-1", "faz-2"] },
        }),
      }),
    );
  });

  it("criar como admin persiste sem checar vinculo", async () => {
    const data = { fazenda_id: "faz-1", cultura_id: "cul-1", sacas_produzidas: 100 };
    prisma.colheitas.create.mockResolvedValue({ id: "c-new", ...data });

    const result = await colheitaRepository.criar({
      usuarioId: "admin-1",
      role: "ADMIN",
      data,
    });

    expect(result).toEqual({ id: "c-new", ...data });
    expect(prisma.usuarios_fazendas.findFirst).not.toHaveBeenCalled();
    expect(prisma.colheitas.create).toHaveBeenCalledWith(
      expect.objectContaining({ data }),
    );
  });

  it("remover bloqueia quando existem gastos vinculados", async () => {
    prisma.colheitas.findFirst.mockResolvedValue({ id: "c1", fazenda_id: "faz-1" });
    prisma.$transaction.mockImplementation(async (cb) =>
      cb({
        gastos: { count: vi.fn().mockResolvedValue(2) },
        lucros: { count: vi.fn() },
        colheitas: { delete: vi.fn() },
      }),
    );

    const result = await colheitaRepository.remover({
      usuarioId: "admin-1",
      role: "ADMIN",
      id: "c1",
    });

    expect(result).toEqual({ blocked: true, reason: "gastos" });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
