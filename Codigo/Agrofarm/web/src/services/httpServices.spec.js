import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import("./api.js");

const { buscarTodos: buscarLucros, criar: criarLucro } = await import("./lucro/lucro.service.js");
const { listarColheitas } = await import("./colheita/colheita.service.js");
const { listInsumos, createInsumo } = await import("./insumo/insumo.service.js");
const { listarFazendas } = await import("./fazenda/fazenda.service.js");
const { listarCulturas } = await import("./cultura/cultura.service.js");
const { lembreteService } = await import("./lembrete/lembrete.service.js");
const { buscarDashboard } = await import("./dashboard/dashboard.service.js");
const { buscarPainelMercado } = await import("./cotacao/cotacao.service.js");
const { listarUsuarios } = await import("./usuario/usuario.service.js");
const { notificacaoService } = await import("./notificacao/notificacao.service.js");
const { listarPoligonos } = await import("./poligono/poligono.service.js");

describe("web HTTP services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: { ok: true } } });
    api.post.mockResolvedValue({ data: { data: { id: "1" } } });
    api.put.mockResolvedValue({ data: { data: { id: "1" } } });
    api.delete.mockResolvedValue({});
  });

  it("lucro.service monta query params e chama endpoints", async () => {
    await buscarLucros({ fazendaId: "f1", page: 2, pageSize: 10 });
    await criarLucro({ colheitaId: "c1" });

    expect(api.get).toHaveBeenCalledWith("/lucros", {
      params: { fazendaId: "f1", page: 2, pageSize: 10 },
    });
    expect(api.post).toHaveBeenCalledWith("/lucros", { colheitaId: "c1" });
  });

  it("colheita, insumo, fazenda e cultura", async () => {
    await listarColheitas({ fazendaId: "f1" });
    await listInsumos({ fazendaId: "f1", page: 1 });
    await createInsumo({ item: "Adubo" });
    await listarFazendas();
    await listarCulturas();

    expect(api.get).toHaveBeenCalledWith("/colheitas", { params: { fazendaId: "f1" } });
    expect(api.get).toHaveBeenCalledWith("/insumos", { params: { fazendaId: "f1", page: 1 } });
    expect(api.post).toHaveBeenCalledWith("/insumos", { item: "Adubo" });
    expect(api.get).toHaveBeenCalledWith("/fazendas");
    expect(api.get).toHaveBeenCalledWith("/culturas");
  });

  it("lembrete, dashboard, cotacao, usuario e notificacao", async () => {
    await lembreteService.buscarPorDia({ data: "2026-05-01", status: "PENDENTE" });
    await buscarDashboard("f1");
    await buscarPainelMercado();
    await listarUsuarios();
    await notificacaoService.listar({ limit: 10 });

    expect(api.get).toHaveBeenCalledWith("/lembretes/dia", {
      params: { data: "2026-05-01", status: "PENDENTE" },
    });
    expect(api.get).toHaveBeenCalledWith("/dashboard", { params: { fazendaId: "f1" } });
    expect(api.get).toHaveBeenCalledWith("/cotacao/mercado");
    expect(api.get).toHaveBeenCalledWith("/usuarios");
    expect(api.get).toHaveBeenCalledWith("/notificacoes", { params: { limit: 10 } });
  });

  it("poligono.service lista por fazenda", async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: { colheitasArquivadas: 0 } } });
    const resultado = await listarPoligonos("faz-1");
    expect(resultado.poligonos).toEqual([]);
    expect(api.get).toHaveBeenCalledWith("/poligonos", { params: { fazendaId: "faz-1" } });
  });
});
