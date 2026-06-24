import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  fazendas: mockModel("findMany", "findUnique", "findFirst", "create", "update", "delete"),
  usuarios_fazendas: mockModel("findFirst", "findMany", "count"),
  fazenda_culturas: mockModel("count"),
  insumos_atividades: mockModel("count"),
  lembretes: mockModel("count", "findMany"),
  colheitas: mockModel("count"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { fazendaRepository } = await import("../../repositories/fazenda.repository.js");
const { prisma } = await import("../../database/client.js");

describe("fazendaRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarTodos retorna fazendas ordenadas por criado_em", async () => {
    const fazendas = [{ id: "faz-1", nome: "Fazenda A" }];
    prisma.fazendas.findMany.mockResolvedValue(fazendas);

    const result = await fazendaRepository.buscarTodos();

    expect(result).toEqual(fazendas);
    expect(prisma.fazendas.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { criado_em: "asc" } }),
    );
  });

  it("buscarPorId consulta fazenda unica", async () => {
    const fazenda = { id: "faz-1", nome: "Fazenda A" };
    prisma.fazendas.findUnique.mockResolvedValue(fazenda);

    const result = await fazendaRepository.buscarPorId("faz-1");

    expect(result).toEqual(fazenda);
    expect(prisma.fazendas.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "faz-1" } }),
    );
  });

  it("usuarioTemVinculo retorna true quando vinculo existe", async () => {
    prisma.usuarios_fazendas.findFirst.mockResolvedValue({ id: "v1" });

    const result = await fazendaRepository.usuarioTemVinculo("u1", "faz-1");

    expect(result).toBe(true);
    expect(prisma.usuarios_fazendas.findFirst).toHaveBeenCalledWith({
      where: { usuario_id: "u1", fazenda_id: "faz-1" },
      select: { id: true },
    });
  });

  it("contarVinculos agrega contagens de entidades relacionadas", async () => {
    prisma.fazenda_culturas.count.mockResolvedValue(3);
    prisma.insumos_atividades.count.mockResolvedValue(10);
    prisma.lembretes.count.mockResolvedValue(2);
    prisma.colheitas.count.mockResolvedValue(5);

    const result = await fazendaRepository.contarVinculos("faz-1");

    expect(result).toEqual({
      fazendaCulturas: 3,
      insumosAtividades: 10,
      lembretes: 2,
      colheitas: 5,
    });
    expect(prisma.fazenda_culturas.count).toHaveBeenCalledWith({
      where: { fazenda_id: "faz-1" },
    });
  });
});
