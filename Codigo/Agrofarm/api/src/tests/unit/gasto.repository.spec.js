import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  gastos: mockModel("findMany", "count", "groupBy", "findUnique", "create", "update", "deleteMany"),
  lucros: mockModel("findMany", "count", "aggregate"),
  fazendas: mockModel("findMany"),
  colheitas: mockModel("findUnique"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { gastoRepository } = await import("../../repositories/gasto.repository.js");
const { prisma } = await import("../../database/client.js");

describe("gastoRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarTodosComFiltros pagina resultados e retorna meta", async () => {
    const items = [{ id: "g1", valor: 100 }];
    prisma.gastos.findMany.mockResolvedValue(items);
    prisma.gastos.count.mockResolvedValue(25);

    const result = await gastoRepository.buscarTodosComFiltros({
      filters: {},
      role: "ADMIN",
      fazendasPermitidas: [],
      page: 2,
      pageSize: 10,
    });

    expect(result.items).toEqual(items);
    expect(result.meta).toEqual({ page: 2, pageSize: 10, totalItems: 25, totalPages: 3 });
    expect(prisma.gastos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(prisma.gastos.count).toHaveBeenCalledOnce();
  });

  it("buscarResumoComFiltros agrega totais por status", async () => {
    prisma.gastos.groupBy.mockResolvedValue([
      { status: "PAGO", _sum: { valor: 300 } },
      { status: "PENDENTE", _sum: { valor: 200 } },
    ]);

    const result = await gastoRepository.buscarResumoComFiltros({
      filters: {},
      role: "ADMIN",
      fazendasPermitidas: [],
    });

    expect(result).toEqual({ totalGasto: 500, totalPago: 300, totalPendente: 200 });
    expect(prisma.gastos.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["status"] }),
    );
  });

  it("buscarPorId consulta gasto com includes", async () => {
    const gasto = { id: "g1", valor: 50 };
    prisma.gastos.findUnique.mockResolvedValue(gasto);

    const result = await gastoRepository.buscarPorId("g1");

    expect(result).toEqual(gasto);
    expect(prisma.gastos.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g1" } }),
    );
  });

  it("create persiste gasto e retorna registro com colheita", async () => {
    const payload = { colheita_id: "col-1", valor: 80, tipo: "ADUBO" };
    const created = { id: "g-new", ...payload };
    prisma.gastos.create.mockResolvedValue(created);

    const result = await gastoRepository.create(payload);

    expect(result).toEqual(created);
    expect(prisma.gastos.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: payload }),
    );
  });
});
