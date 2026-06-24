import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock, mockModel } from "../helpers/mockPrisma.js";

const prismaMock = {
  colheitas: mockModel("findMany", "findUnique"),
  entregas_arrendamento: mockModel("findMany", "count", "findUnique", "update"),
};

vi.mock("../../database/client.js", () => createPrismaMock(prismaMock));

const { estoqueRepository } = await import("../../repositories/estoque.repository.js");
const { prisma } = await import("../../database/client.js");

describe("estoqueRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarColheitasComLucros filtra por fazenda e cultura", async () => {
    const colheitas = [{ id: "c1", fazenda_id: "faz-1" }];
    prisma.colheitas.findMany.mockResolvedValue(colheitas);

    const result = await estoqueRepository.buscarColheitasComLucros({
      fazendaId: "faz-1",
      culturaId: "cul-1",
      role: "ADMIN",
      fazendasPermitidas: [],
    });

    expect(result).toEqual(colheitas);
    expect(prisma.colheitas.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fazenda_id: "faz-1", cultura_id: "cul-1" },
      }),
    );
  });

  it("buscarColheitaPorId retorna colheita com includes de estoque", async () => {
    const colheita = { id: "c1", lucros: [] };
    prisma.colheitas.findUnique.mockResolvedValue(colheita);

    const result = await estoqueRepository.buscarColheitaPorId("c1");

    expect(result).toEqual(colheita);
    expect(prisma.colheitas.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1" } }),
    );
  });

  it("buscarEntregasPendentes pagina entregas com status PENDENTE", async () => {
    const items = [{ id: "e1", status: "PENDENTE" }];
    prisma.entregas_arrendamento.findMany.mockResolvedValue(items);
    prisma.entregas_arrendamento.count.mockResolvedValue(12);

    const result = await estoqueRepository.buscarEntregasPendentes({
      fazendaId: "faz-1",
      page: 2,
      pageSize: 5,
    });

    expect(result.items).toEqual(items);
    expect(result.meta).toEqual({ page: 2, pageSize: 5, totalItems: 12, totalPages: 3 });
    expect(prisma.entregas_arrendamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDENTE", fazenda_id: "faz-1" },
        skip: 5,
        take: 5,
      }),
    );
  });

  it("atualizarEntrega persiste dados e retorna registro atualizado", async () => {
    const dados = { status: "ENTREGUE" };
    const updated = { id: "e1", ...dados };
    prisma.entregas_arrendamento.update.mockResolvedValue(updated);

    const result = await estoqueRepository.atualizarEntrega("e1", dados);

    expect(result).toEqual(updated);
    expect(prisma.entregas_arrendamento.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "e1" }, data: dados }),
    );
  });
});
