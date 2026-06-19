import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repositories/cultura.repository.js", () => ({
  culturaRepository: {
    buscarTodos: vi.fn(),
    buscarPorNome: vi.fn(),
    buscarPorId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    contarVinculos: vi.fn(),
    delete: vi.fn(),
  },
}));

const { culturaService } = await import("../../services/cultura.service.js");
const { culturaRepository } = await import("../../repositories/cultura.repository.js");

describe("culturaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria cultura com nome normalizado", async () => {
    culturaRepository.buscarPorNome.mockResolvedValue(null);
    culturaRepository.create.mockResolvedValue({ id: "cul-1", nome: "Soja" });

    const resultado = await culturaService.criar({ nome: "  Soja  ", cor: "#00ff00" });

    expect(culturaRepository.create).toHaveBeenCalledWith({ nome: "Soja", cor: "#00ff00" });
    expect(resultado.nome).toBe("Soja");
  });

  it("rejeita nome duplicado na criacao", async () => {
    culturaRepository.buscarPorNome.mockResolvedValue({ id: "cul-existente" });

    await expect(culturaService.criar({ nome: "Milho", cor: "#ff0" })).rejects.toMatchObject({
      message: "Já existe uma cultura com esse nome",
      statusCode: 409,
    });
  });

  it("atualizar exige ao menos um campo", async () => {
    culturaRepository.buscarPorId.mockResolvedValue({ id: "cul-1", nome: "Soja" });

    await expect(culturaService.atualizar("cul-1", {})).rejects.toMatchObject({
      message: "Informe ao menos um campo para atualizar",
      statusCode: 400,
    });
  });

  it("deletar bloqueia quando ha vinculos com fazendas", async () => {
    culturaRepository.buscarPorId.mockResolvedValue({ id: "cul-1", nome: "Soja" });
    culturaRepository.contarVinculos.mockResolvedValue({ fazendaCulturas: 2, colheitas: 0 });

    await expect(culturaService.deletar("cul-1")).rejects.toMatchObject({
      message: "Não é possível excluir: cultura está vinculada a fazendas",
      statusCode: 400,
    });
  });
});
