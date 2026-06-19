import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../database/client.js", () => ({
  prisma: {
    insumos_atividades: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../../shared/fazenda/fazendaOperacao.js", () => ({
  assertFazendaOperavelPorId: vi.fn(),
}));

vi.mock("../../repositories/insumo.repository.js", () => ({
  insumoRepository: {
    listar: vi.fn(),
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

vi.mock("../../services/notificacao.service.js", () => ({
  notificacaoService: {
    notificarNovoInsumoParaAdmins: vi.fn(),
  },
}));

const { insumoService } = await import("../../services/insumo.service.js");
const { insumoRepository } = await import("../../repositories/insumo.repository.js");
const { usuarioRepository } = await import("../../repositories/usuario.repository.js");
const { notificacaoService } = await import("../../services/notificacao.service.js");
const { prisma } = await import("../../database/client.js");
const { assertFazendaOperavelPorId } = await import("../../shared/fazenda/fazendaOperacao.js");

describe("insumoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista insumos para admin sem validar fazenda vinculada", async () => {
    insumoRepository.listar.mockResolvedValue({ items: [], meta: {} });

    await insumoService.listar({
      usuarioId: "admin",
      role: "ADMIN",
      query: { page: 1, pageSize: 5 },
    });

    expect(insumoRepository.listar).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN", fazendaIdsPermitidas: null }),
    );
  });

  it("bloqueia funcionario acessando fazenda fora do escopo", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);

    await expect(
      insumoService.listar({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        query: { fazendaId: "faz-2", page: 1, pageSize: 5 },
      }),
    ).rejects.toMatchObject({ message: "Fazenda nao encontrada ou sem acesso", statusCode: 403 });
  });

  it("criar notifica admins quando autor nao e admin", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    insumoRepository.criar.mockResolvedValue({ id: "ins-1", item: "Adubo" });
    assertFazendaOperavelPorId.mockResolvedValue();

    await insumoService.criar({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      payload: {
        fazendaId: "faz-1",
        item: "Adubo",
        categoria: "FERTILIZANTE",
        quantidade: 10,
        unidade: "kg",
        valorUnitario: 5,
        data: "2026-05-01",
      },
    });

    expect(notificacaoService.notificarNovoInsumoParaAdmins).toHaveBeenCalledWith({
      insumo: { id: "ins-1", item: "Adubo" },
      autorId: "u1",
    });
  });

  it("criar nao notifica admins quando autor e admin", async () => {
    insumoRepository.criar.mockResolvedValue({ id: "ins-2" });
    assertFazendaOperavelPorId.mockResolvedValue();

    await insumoService.criar({
      usuarioId: "admin",
      role: "ADMIN",
      payload: {
        fazendaId: "faz-1",
        item: "Semente",
        categoria: "SEMENTE",
        quantidade: 1,
        unidade: "sc",
        valorUnitario: 100,
        data: "2026-05-01",
      },
    });

    expect(notificacaoService.notificarNovoInsumoParaAdmins).not.toHaveBeenCalled();
  });

  it("atualizar retorna 404 quando registro nao encontrado", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    insumoRepository.atualizar.mockResolvedValue(null);
    prisma.insumos_atividades.findFirst.mockResolvedValue(null);

    await expect(
      insumoService.atualizar({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        id: "ins-x",
        payload: { item: "Novo nome" },
      }),
    ).rejects.toMatchObject({
      message: "Registro nao encontrado ou sem permissao para editar",
      statusCode: 404,
    });
  });
});
