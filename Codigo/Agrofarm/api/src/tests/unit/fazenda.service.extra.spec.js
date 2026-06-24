import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/fazenda.repository.js", () => ({
  fazendaRepository: {
    buscarTodos: vi.fn(),
    buscarTodosPorUsuario: vi.fn(),
    usuarioTemVinculo: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorNome: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    contarVinculos: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    lucros: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    entregas_arrendamento: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

const { fazendaService } = await import("../../services/fazenda.service.js");
const { fazendaRepository } = await import("../../repositories/fazenda.repository.js");

describe("fazendaService CRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria fazenda com nome trimado", async () => {
    fazendaRepository.create.mockResolvedValue({ id: "f1", nome: "Fazenda" });
    fazendaRepository.buscarPorId.mockResolvedValue({ id: "f1", nome: "Fazenda" });

    const resultado = await fazendaService.criar({
      nome: "  Fazenda  ",
      tipo: "PROPRIA",
      localizacao: "  MG  ",
    });

    expect(fazendaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Fazenda",
        tipo: "PROPRIA",
        localizacao: "MG",
        ativa: true,
      }),
    );
    expect(resultado.id).toBe("f1");
  });

  it("atualiza fazenda existente", async () => {
    fazendaRepository.buscarPorId.mockResolvedValue({ id: "f1", tipo: "PROPRIA" });
    fazendaRepository.update.mockResolvedValue({ id: "f1", nome: "Novo" });

    const resultado = await fazendaService.atualizar("f1", { nome: " Novo " });
    expect(resultado.nome).toBe("Novo");
  });

  it("deletar bloqueia quando ha colheitas", async () => {
    fazendaRepository.buscarPorId.mockResolvedValue({ id: "f1" });
    fazendaRepository.contarVinculos.mockResolvedValue({
      fazendaCulturas: 0,
      colheitas: 2,
      insumosAtividades: 0,
      lembretes: 0,
    });

    await expect(fazendaService.deletar("f1")).rejects.toMatchObject({
      message: "Não é possível excluir: fazenda possui colheitas registradas",
      statusCode: 400,
    });
  });

  it("deletar remove quando sem vinculos", async () => {
    fazendaRepository.buscarPorId.mockResolvedValue({ id: "f1" });
    fazendaRepository.contarVinculos.mockResolvedValue({
      fazendaCulturas: 0,
      colheitas: 0,
      insumosAtividades: 0,
      lembretes: 0,
    });

    const { prisma } = await import("../../database/client.js");

    await fazendaService.deletar("f1");
    expect(prisma.entregas_arrendamento.deleteMany).toHaveBeenCalledWith({
      where: { fazenda_id: "f1" },
    });
    expect(fazendaRepository.delete).toHaveBeenCalledWith("f1");
  });
});
