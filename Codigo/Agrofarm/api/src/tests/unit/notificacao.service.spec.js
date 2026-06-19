import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/notificacao.repository.js", () => ({
  notificacaoRepository: {
    listarPorUsuario: vi.fn(),
    contarNaoLidas: vi.fn(),
    contarNaoLidasMarcaveis: vi.fn(),
    marcarComoLida: vi.fn(),
    marcarTodasComoLidas: vi.fn(),
    marcarTodasComoLidasExcetoTipos: vi.fn(),
    criarMuitas: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    lembretes: { findMany: vi.fn() },
    usuarios: { findMany: vi.fn() },
    lucros: { findMany: vi.fn() },
    gastos: { findMany: vi.fn() },
    notificacoes: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { notificacaoService } = await import("../../services/notificacao.service.js");
const { notificacaoRepository } = await import("../../repositories/notificacao.repository.js");
const { prisma } = await import("../../database/client.js");

describe("notificacaoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.lembretes.findMany.mockResolvedValue([]);
    notificacaoRepository.listarPorUsuario.mockResolvedValue([{ id: "n1" }]);
    notificacaoRepository.contarNaoLidas.mockResolvedValue(1);
    notificacaoRepository.contarNaoLidasMarcaveis.mockResolvedValue(1);
  });

  it("listarParaUsuario retorna items e contagem", async () => {
    const resultado = await notificacaoService.listarParaUsuario({
      usuario: { id: "u1" },
      limit: 5,
    });

    expect(resultado.items).toHaveLength(1);
    expect(resultado.unreadCount).toBe(1);
    expect(resultado.unreadMarcaveis).toBe(1);
  });

  it("marcarComoLida falha quando notificacao nao existe", async () => {
    prisma.notificacoes.findFirst.mockResolvedValue(null);

    await expect(
      notificacaoService.marcarComoLida({
        usuario: { id: "u1" },
        notificacaoId: "n-x",
      }),
    ).rejects.toMatchObject({ message: "Notificação não encontrada", statusCode: 404 });
  });

  it("notificarNovoInsumoParaAdmins cria uma notificacao por fazenda para admins", async () => {
    prisma.usuarios.findMany.mockResolvedValue([{ id: "admin-1" }]);
    prisma.notificacoes.findFirst.mockResolvedValue(null);

    await notificacaoService.notificarNovoInsumoParaAdmins({
      insumo: {
        id: "ins-1",
        fazenda_id: "faz-1",
        item: "Adubo",
        fazendas: { id: "faz-1", nome: "Fazenda 1" },
        usuarios: { nome: "Func" },
      },
      autorId: "u-func",
    });

    expect(prisma.notificacoes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "INSUMO_NOVO",
          usuario_id: "admin-1",
          referencia_id: "faz-1",
          titulo: expect.stringContaining("Um novo insumo surgiu na fazenda"),
        }),
      }),
    );
  });

  it("sincronizarNotificacoesGastos nao reabre notificacao ja marcada como lida", async () => {
    const lidaEm = new Date("2026-05-20T12:00:00Z");
    prisma.usuarios.findMany.mockResolvedValue([{ id: "admin-1" }]);
    prisma.gastos.findMany.mockResolvedValue([
      {
        id: "gasto-1",
        descricao: "Conta de energia",
        tipo: "ENERGIA",
        data_vencimento: new Date("2026-05-05"),
        data: new Date("2026-05-05"),
        colheitas: { fazendas: { id: "faz-1", nome: "Teste" } },
      },
    ]);
    prisma.notificacoes.findFirst.mockResolvedValue({ id: "n-gasto", lida_em: lidaEm });
    prisma.notificacoes.findMany.mockResolvedValue([]);

    await notificacaoService.sincronizarNotificacoesGastos();

    expect(prisma.notificacoes.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lida_em: lidaEm }),
      }),
    );
    const updateData = prisma.notificacoes.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("lida_em", null);
  });

  it("marcarComoLida bloqueia tipo ARRENDAMENTO_RECEBER", async () => {
    prisma.notificacoes.findFirst.mockResolvedValue({ tipo: "ARRENDAMENTO_RECEBER" });

    await expect(
      notificacaoService.marcarComoLida({
        usuario: { id: "admin-1", role: "ADMIN" },
        notificacaoId: "n-arr",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
