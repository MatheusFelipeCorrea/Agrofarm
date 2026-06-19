import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";

vi.mock("../../repositories/gasto.repository.js", () => ({
  gastoRepository: {
    buscarTodosComFiltros: vi.fn(),
    buscarResumoComFiltros: vi.fn(),
    buscarPorColheita: vi.fn(),
    buscarPorId: vi.fn(),
    buscarColheitaPorId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    buscarArrendamentosPendentes: vi.fn().mockResolvedValue({ items: [], meta: { totalItems: 0 } }),
    somarArrendamentosPendentes: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock("../../repositories/usuario.repository.js", () => ({
  usuarioRepository: {
    buscarIdsFazendasVinculadas: vi.fn(),
  },
}));

vi.mock("../../shared/fazenda/fazendaOperacao.js", () => ({
  assertFazendaOperavelPorColheitaId: vi.fn(),
}));

const { gastoService } = await import("../../services/gasto.service.js");
const { assertFazendaOperavelPorColheitaId } = await import("../../shared/fazenda/fazendaOperacao.js");
const { gastoRepository } = await import("../../repositories/gasto.repository.js");
const { usuarioRepository } = await import("../../repositories/usuario.repository.js");

describe("gastoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create passa campos planos ao repository (sem data aninhado)", async () => {
    assertFazendaOperavelPorColheitaId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarColheitaPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    gastoRepository.create.mockResolvedValue({ id: "gasto-1" });

    await gastoService.create({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      payload: {
        colheitaId: "col-1",
        tipo: "ADUBO",
        valor: 100,
        data: "2026-05-01",
        status: "PAGO",
      },
    });

    const payload = gastoRepository.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      colheita_id: "col-1",
      tipo: "ADUBO",
      valor: 100,
      status: "PAGO",
    });
    expect(payload.data).toBeInstanceOf(Date);
    expect(payload.data?.colheita_id).toBeUndefined();
  });

  it("bloqueia create quando fazenda da colheita e somente leitura", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarColheitaPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-arrendada" });
    assertFazendaOperavelPorColheitaId.mockRejectedValue(
      new AppError("Esta fazenda é arrendada para terceiros e permite apenas consulta.", 403),
    );

    await expect(
      gastoService.create({
        usuarioId: "admin",
        role: "ADMIN",
        payload: {
          colheitaId: "col-1",
          tipo: "ADUBO",
          valor: 100,
          data: "2026-05-01",
          status: "PAGO",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(gastoRepository.create).not.toHaveBeenCalled();
  });

  it("exige tipo personalizado quando tipo e OUTRO", async () => {
    assertFazendaOperavelPorColheitaId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarColheitaPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });

    await expect(
      gastoService.create({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        payload: {
          colheitaId: "col-1",
          tipo: "OUTRO",
          valor: 50,
          data: "2026-05-01",
          status: "PENDENTE",
        },
      }),
    ).rejects.toMatchObject({ message: "Tipo personalizado obrigatorio", statusCode: 400 });

    expect(gastoRepository.create).not.toHaveBeenCalled();
  });

  it("bloqueia funcionario sem fazendas vinculadas", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue([]);

    await expect(
      gastoService.getAll({ usuarioId: "u1", role: "FUNCIONARIO", query: { page: 1, pageSize: 20 } }),
    ).rejects.toMatchObject({ message: "Funcionario sem fazendas vinculadas", statusCode: 422 });
  });

  it("rejeita filtro fazendaId=all para funcionario", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);

    await expect(
      gastoService.getAll({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        query: { fazendaId: "all", page: 1, pageSize: 20 },
      }),
    ).rejects.toMatchObject({ message: "Parametros de filtro invalidos", statusCode: 400 });
  });

  it("getAll retorna lista e resumo para admin", async () => {
    gastoRepository.buscarTodosComFiltros.mockResolvedValue({
      items: [{ id: "g1" }],
      meta: { total: 1, page: 1, pageSize: 20 },
    });
    gastoRepository.buscarResumoComFiltros.mockResolvedValue({
      totalGasto: 100,
      totalPago: 60,
      totalPendente: 40,
    });

    const resultado = await gastoService.getAll({
      usuarioId: "admin",
      role: "ADMIN",
      query: { page: 1, pageSize: 20 },
    });

    expect(resultado.items).toHaveLength(1);
    expect(resultado.totals.totalGasto).toBe(100);
    expect(usuarioRepository.buscarIdsFazendasVinculadas).not.toHaveBeenCalled();
  });

  it("update retorna 404 quando gasto nao existe", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      gastoService.update({
        usuarioId: "u1",
        role: "FUNCIONARIO",
        id: "gasto-x",
        payload: { valor: 10 },
      }),
    ).rejects.toMatchObject({ message: "Gasto nao encontrado", statusCode: 404 });
  });

  it("getResumo delega ao repository", async () => {
    gastoRepository.buscarResumoComFiltros.mockResolvedValue({ totalGasto: 100 });

    const resumo = await gastoService.getResumo({
      usuarioId: "admin",
      role: "ADMIN",
      query: { page: 1, pageSize: 20 },
    });

    expect(resumo.totalGasto).toBe(100);
  });

  it("getPorColheita valida colheita antes de listar", async () => {
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarColheitaPorId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    gastoRepository.buscarPorColheita.mockResolvedValue({ items: [], meta: {} });

    await gastoService.getPorColheita({
      usuarioId: "u1",
      role: "FUNCIONARIO",
      colheitaId: "col-1",
      query: { page: 1, pageSize: 20 },
    });

    expect(gastoRepository.buscarPorColheita).toHaveBeenCalled();
  });

  it("remove chama repository delete", async () => {
    assertFazendaOperavelPorColheitaId.mockResolvedValue({ id: "col-1", fazenda_id: "faz-1" });
    usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(["faz-1"]);
    gastoRepository.buscarPorId.mockResolvedValue({
      id: "gasto-1",
      colheita_id: "col-1",
      colheitas: { fazenda_id: "faz-1" },
    });
    gastoRepository.delete.mockResolvedValue(true);

    await gastoService.remover({ usuarioId: "u1", role: "FUNCIONARIO", id: "gasto-1" });

    expect(gastoRepository.delete).toHaveBeenCalledWith("gasto-1");
  });
});
