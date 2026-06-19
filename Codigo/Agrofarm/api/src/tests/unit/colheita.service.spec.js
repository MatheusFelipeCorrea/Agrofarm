import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/colheita.repository.js", () => ({
  colheitaRepository: {
    buscarTodosComFiltros: vi.fn(),
    buscarPorFazenda: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
  },
}));

vi.mock("../../repositories/usuario.repository.js", () => ({
  usuarioRepository: {
    buscarIdsFazendasVinculadas: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    fazendas: { findUnique: vi.fn() },
    culturas: { findUnique: vi.fn() },
    fazenda_culturas: { findFirst: vi.fn() },
    colheitas: { findFirst: vi.fn() },
  },
}));

const { colheitaService } = await import("../../services/colheita.service.js");
const { colheitaRepository } = await import("../../repositories/colheita.repository.js");
const { usuarioRepository } = await import("../../repositories/usuario.repository.js");
const { prisma } = await import("../../database/client.js");

describe("colheitaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista colheitas para admin sem restringir fazendas", async () => {
    colheitaRepository.buscarTodosComFiltros.mockResolvedValue([{ id: "c1" }]);

    const resultado = await colheitaService.listar({
      usuarioId: "admin",
      role: "ADMIN",
      fazendaId: "all",
    });

    expect(resultado).toEqual([{ id: "c1" }]);
    expect(usuarioRepository.buscarIdsFazendasVinculadas).not.toHaveBeenCalled();
  });

  it("bloqueia funcionario consultando fazenda fora do escopo", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);

    await expect(
      colheitaService.buscarPorFazenda({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        fazendaId: "faz-2",
      }),
    ).rejects.toMatchObject({
      message: "Sem permissao para consultar colheitas desta fazenda",
      statusCode: 403,
    });
  });

  it("cria colheita quando cultura esta vinculada a fazenda", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    prisma.fazendas.findUnique.mockResolvedValue({ id: "faz-1" });
    prisma.culturas.findUnique.mockResolvedValue({ id: "cul-1" });
    prisma.fazenda_culturas.findFirst.mockResolvedValue({ id: "fc-1" });
    colheitaRepository.criar.mockResolvedValue({ id: "col-1" });

    const resultado = await colheitaService.criar({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      payload: {
        fazendaId: "faz-1",
        culturaId: "cul-1",
        dataColheita: "2026-05-10",
        sacasProduzidas: 120,
      },
    });

    expect(resultado).toEqual({ id: "col-1" });
    expect(colheitaRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fazenda_id: "faz-1",
          cultura_id: "cul-1",
          sacas_produzidas: 120,
        }),
      }),
    );
  });

  it("rejeita criacao quando cultura nao esta vinculada", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    prisma.fazendas.findUnique.mockResolvedValue({ id: "faz-1" });
    prisma.culturas.findUnique.mockResolvedValue({ id: "cul-1" });
    prisma.fazenda_culturas.findFirst.mockResolvedValue(null);

    await expect(
      colheitaService.criar({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        payload: {
          fazendaId: "faz-1",
          culturaId: "cul-1",
          dataColheita: "2026-05-10",
          sacasProduzidas: 10,
        },
      }),
    ).rejects.toMatchObject({
      message: "A cultura selecionada não está vinculada à fazenda informada",
      statusCode: 400,
    });
  });

  it("buscarPorId retorna colheita quando encontrada", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    colheitaRepository.buscarPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });

    const resultado = await colheitaService.buscarPorId({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      id: "col-1",
    });

    expect(resultado.id).toBe("col-1");
  });

  it("atualizar persiste alteracoes", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    colheitaRepository.buscarPorId.mockResolvedValue({
      id: "col-1",
      fazenda_id: "faz-1",
      cultura_id: "cul-1",
    });
    prisma.fazenda_culturas.findFirst.mockResolvedValue({ id: "fc-1" });
    colheitaRepository.atualizar.mockResolvedValue({ id: "col-1", area: 50 });

    const resultado = await colheitaService.atualizar({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      id: "col-1",
      payload: { area: 50 },
    });

    expect(resultado.area).toBe(50);
  });

  it("remover exclui quando sem bloqueios", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    colheitaRepository.buscarPorId.mockResolvedValue({ id: "col-1" });
    colheitaRepository.remover.mockResolvedValue(true);

    await colheitaService.remover({ usuarioId: "u1", role: "FUNCIONARIO", id: "col-1" });
    expect(colheitaRepository.remover).toHaveBeenCalled();
  });

  it("remover bloqueia quando ha gastos vinculados", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    colheitaRepository.buscarPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    colheitaRepository.remover.mockResolvedValue({ blocked: true, reason: "gastos" });

    await expect(
      colheitaService.remover({ usuarioId: "u1", role: "FUNCIONARIO", id: "col-1" }),
    ).rejects.toMatchObject({
      message: "Não é possível excluir: colheita possui gastos vinculados",
      statusCode: 400,
    });
  });
});
