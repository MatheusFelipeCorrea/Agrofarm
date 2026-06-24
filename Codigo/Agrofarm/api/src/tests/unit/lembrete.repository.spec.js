import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  lembretes: mockModel("findMany", "findUnique", "create", "update", "delete", "deleteMany"),
  gastos: mockModel("findMany"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { lembreteRepository } = await import("../../repositories/lembrete.repository.js");
const { prisma } = await import("../../database/client.js");

describe("lembreteRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarPorId retorna lembrete com vinculos", async () => {
    const lembrete = { id: "lem-1", titulo: "Plantio" };
    prisma.lembretes.findUnique.mockResolvedValue(lembrete);

    const result = await lembreteRepository.buscarPorId("lem-1");

    expect(result).toEqual(lembrete);
    expect(prisma.lembretes.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "lem-1" } }),
    );
  });

  it("criar persiste lembrete com includes de vinculo", async () => {
    const data = { titulo: "Colheita", usuario_id: "u1", data_lembrete: new Date() };
    prisma.lembretes.create.mockResolvedValue({ id: "lem-new", ...data });

    const result = await lembreteRepository.criar(data);

    expect(result.id).toBe("lem-new");
    expect(prisma.lembretes.create).toHaveBeenCalledWith(
      expect.objectContaining({ data }),
    );
  });

  it("buscarTodosComFiltros aplica status ATRASADO como pendente com data passada", async () => {
    prisma.lembretes.findMany.mockResolvedValue([]);

    await lembreteRepository.buscarTodosComFiltros({
      status: "ATRASADO",
      fazendaIdsPermitidas: ["faz-1"],
    });

    expect(prisma.lembretes.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDENTE",
          data_lembrete: expect.objectContaining({ lt: expect.any(Date) }),
          OR: [{ fazenda_id: { in: ["faz-1"] } }, { fazenda_id: null }],
        }),
      }),
    );
  });

  it("buscarPendentesParaEnvio filtra por intervalo de datas e status", async () => {
    const inicio = new Date("2026-06-01");
    const fim = new Date("2026-06-07");
    const pendentes = [{ id: "lem-1", status: "PENDENTE" }];
    prisma.lembretes.findMany.mockResolvedValue(pendentes);

    const result = await lembreteRepository.buscarPendentesParaEnvio(inicio, fim);

    expect(result).toEqual(pendentes);
    expect(prisma.lembretes.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PENDENTE",
          data_lembrete: { gte: inicio, lte: fim },
        },
      }),
    );
  });
});
