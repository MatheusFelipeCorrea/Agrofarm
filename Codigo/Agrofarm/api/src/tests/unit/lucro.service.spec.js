import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/lucro.repository.js", () => ({
  lucroRepository: {
    buscarTodosComFiltros: vi.fn(),
    buscarTotalComFiltros: vi.fn(),
    buscarPorColheitaComAuth: vi.fn(),
    buscarPorId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    usuarios_fazendas: { findMany: vi.fn() },
    fazendas: { findMany: vi.fn(), findUnique: vi.fn() },
    colheitas: { findFirst: vi.fn(), findUnique: vi.fn() },
    lucros: { aggregate: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    entregas_arrendamento: { aggregate: vi.fn() },
    notificacoes: { deleteMany: vi.fn() },
  },
}));

vi.mock("../../services/notificacao.service.js", () => ({
  notificacaoService: {
    sincronizarNotificacoesArrendamento: vi.fn(),
    resolverNotificacaoArrendamento: vi.fn(),
  },
}));

const { lucroService } = await import("../../services/lucro.service.js");
const { lucroRepository } = await import("../../repositories/lucro.repository.js");
const { prisma } = await import("../../database/client.js");

describe("lucroService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.fazendas.findMany.mockResolvedValue([]);
    prisma.fazendas.findUnique.mockResolvedValue({ id: "faz-1", tipo: "PROPRIA" });
    prisma.entregas_arrendamento.aggregate.mockResolvedValue({ _sum: { quantidade_sacas: 0 } });
  });

  it("listar exige fazendas vinculadas para funcionario", async () => {
    prisma.usuarios_fazendas.findMany.mockResolvedValue([]);

    await expect(
      lucroService.listar({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        query: { page: 1, pageSize: 20 },
      }),
    ).rejects.toMatchObject({ message: "Funcionario sem fazendas vinculadas", statusCode: 422 });
  });

  it("criar rejeita quando colheita nao tem producao", async () => {
    prisma.colheitas.findUnique.mockResolvedValue({
      id: "col-1",
      sacas_produzidas: 0,
      cultura_id: "cult-1",
      fazenda_id: "faz-1",
      culturas: { nome: "Café" },
    });
    prisma.lucros.aggregate.mockResolvedValue({ _sum: { quantidade_sacas: 0 } });

    await expect(
      lucroService.criar({
        usuarioId: "admin",
        role: "ADMIN",
        payload: {
          colheitaId: "col-1",
          quantidadeSacas: 10,
          valorUnitario: 150,
          comprador: "Cooperativa",
          data: "2026-05-01",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(lucroRepository.create).not.toHaveBeenCalled();
  });

  it("criar rejeita quando quantidade excede saldo de sacas", async () => {
    prisma.colheitas.findUnique.mockResolvedValue({
      id: "col-1",
      sacas_produzidas: 100,
      cultura_id: "cult-1",
      fazenda_id: "faz-1",
      culturas: { nome: "Soja" },
    });
    prisma.lucros.aggregate.mockResolvedValue({ _sum: { quantidade_sacas: 90 } });

    await expect(
      lucroService.criar({
        usuarioId: "admin",
        role: "ADMIN",
        payload: {
          colheitaId: "col-1",
          quantidadeSacas: 20,
          valorUnitario: 150,
          comprador: "Cooperativa",
          data: "2026-05-01",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(lucroRepository.create).not.toHaveBeenCalled();
  });

  it("criar persiste lucro quando saldo permite", async () => {
    prisma.colheitas.findUnique.mockResolvedValue({
      id: "col-1",
      sacas_produzidas: 100,
      cultura_id: "cult-1",
      fazenda_id: "faz-1",
      culturas: { nome: "Soja" },
    });
    prisma.lucros.aggregate.mockResolvedValue({ _sum: { quantidade_sacas: 10 } });
    lucroRepository.create.mockResolvedValue({ id: "lucro-1" });

    const resultado = await lucroService.criar({
      usuarioId: "admin",
      role: "ADMIN",
      payload: {
        colheitaId: "col-1",
        quantidadeSacas: 20,
        valorUnitario: 150,
        comprador: "Cooperativa",
        data: "2026-05-01",
      },
    });

    expect(resultado).toEqual({ id: "lucro-1" });
    expect(lucroRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        colheita_id: "col-1",
        quantidade_sacas: 20,
        valor_unitario: 150,
      }),
    );
  });

  it("deletar retorna 404 quando lucro nao existe", async () => {
    lucroRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      lucroService.deletar({ usuarioId: "admin", role: "ADMIN", id: "lucro-x" }),
    ).rejects.toMatchObject({ message: "Lucro não encontrado", statusCode: 404 });
  });

  it("listar e buscarTotal para admin", async () => {
    lucroRepository.buscarTodosComFiltros.mockResolvedValue({ items: [] });
    lucroRepository.buscarTotalComFiltros.mockResolvedValue({ totalLucro: 500 });

    const lista = await lucroService.listar({
      usuarioId: "admin",
      role: "ADMIN",
      query: { page: 1, pageSize: 20 },
    });
    const total = await lucroService.buscarTotal({
      usuarioId: "admin",
      role: "ADMIN",
      query: {},
    });

    expect(lista).toEqual({ items: [] });
    expect(total.totalLucro).toBe(500);
  });

  it("deletar remove lucro existente", async () => {
    lucroRepository.buscarPorId.mockResolvedValue({
      id: "l1",
      colheitas: { fazenda_id: "faz-1" },
    });

    await lucroService.deletar({ usuarioId: "admin", role: "ADMIN", id: "l1" });
    expect(lucroRepository.delete).toHaveBeenCalledWith("l1");
  });

  it("funcionario sem permissao na fazenda ao criar lucro", async () => {
    prisma.usuarios_fazendas.findMany.mockResolvedValue([{ fazenda_id: "faz-1" }]);
    prisma.colheitas.findFirst.mockResolvedValue(null);

    await expect(
      lucroService.criar({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        payload: {
          colheitaId: "col-fora",
          quantidadeSacas: 5,
          valorUnitario: 100,
          comprador: "X",
          data: "2026-05-01",
        },
      }),
    ).rejects.toMatchObject({
      message: "Sem permissao para registrar lucro nesta fazenda",
      statusCode: 403,
    });
  });
});
