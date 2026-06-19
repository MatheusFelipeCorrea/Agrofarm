import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import("./api.js");

const colheita = await import("./colheita/colheita.service.js");
const fazenda = await import("./fazenda/fazenda.service.js");
const cultura = await import("./cultura/cultura.service.js");
const lucro = await import("./lucro/lucro.service.js");
const insumo = await import("./insumo/insumo.service.js");
const gasto = await import("./gasto/gasto.service.js");
const usuario = await import("./usuario/usuario.service.js");
const poligono = await import("./poligono/poligono.service.js");
const cotacao = await import("./cotacao/cotacao.service.js");
const { lembreteService } = await import("./lembrete/lembrete.service.js");
const { notificacaoService } = await import("./notificacao/notificacao.service.js");

describe("web HTTP services — cobertura completa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [], fazendas: [], culturas: [], fazenda: {}, ok: true } });
    api.post.mockResolvedValue({ data: { data: { id: "1" }, fazenda: { id: "1" } } });
    api.put.mockResolvedValue({ data: { data: { id: "1" }, fazenda: { id: "1" } } });
    api.patch.mockResolvedValue({ data: {} });
    api.delete.mockResolvedValue({});
  });

  it("colheita CRUD", async () => {
    await colheita.listarColheitas({ fazendaId: "f1" });
    await colheita.buscarColheitaPorId("c1");
    await colheita.buscarColheitasPorFazenda("f1");
    await colheita.criarColheita({ fazendaId: "f1" });
    await colheita.atualizarColheita("c1", { area: 10 });
    await colheita.excluirColheita("c1");

    expect(api.get).toHaveBeenCalledWith("/colheitas", expect.any(Object));
    expect(api.delete).toHaveBeenCalledWith("/colheitas/c1");
  });

  it("fazenda e culturas vinculadas", async () => {
    await fazenda.listarFazendas();
    await fazenda.buscarFazenda("f1");
    await fazenda.criarFazenda({ nome: "Fazenda" });
    await fazenda.atualizarFazenda("f1", { nome: "Novo" });
    await fazenda.excluirFazenda("f1");
    await fazenda.listarCulturasDaFazenda("f1");
    await fazenda.adicionarCulturaNaFazenda("f1", { culturaId: "c1" });
    await fazenda.atualizarCulturaDaFazenda("f1", "v1", { hectares: 10 });
    await fazenda.excluirCulturaDaFazenda("f1", "v1");

    expect(api.get).toHaveBeenCalledWith("/fazendas/f1/culturas");
    expect(api.delete).toHaveBeenCalledWith("/fazendas/f1/culturas/v1");
  });

  it("cultura, lucro, insumo e gasto", async () => {
    await cultura.listarCulturas();
    await cultura.criarCultura({ nome: "Soja" });
    await cultura.atualizarCultura("c1", { cor: "#fff" });
    await cultura.excluirCultura("c1");

    await lucro.buscarTotal({ fazendaId: "f1" });
    await lucro.buscarPorColheita("col-1");
    await lucro.atualizar("l1", { valorUnitario: 100 });
    await lucro.deletar("l1");

    await insumo.updateInsumo("i1", { item: "X" });
    await insumo.deleteInsumo("i1");

    await gasto.getGastosResumo({ status: "PAGO" });
    await gasto.updateGasto("g1", { valor: 50 });

    expect(api.get).toHaveBeenCalledWith("/lucros/total", expect.any(Object));
    expect(api.put).toHaveBeenCalledWith("/gastos/g1", { valor: 50 });
  });

  it("usuario, poligono, cotacao, lembrete e notificacao", async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });

    await usuario.buscarUsuario("u1");
    await usuario.atualizarUsuario("u1", { nome: "Novo" });
    await usuario.excluirUsuario("u1");

    await poligono.buscarPoligono("p1");
    await poligono.criarPoligono({ nome: "Area" });
    await poligono.atualizarPoligono("p1", { nome: "Area 2" });
    await poligono.excluirPoligono("p1");
    await poligono.exportarPoligonos("f1");
    await poligono.importarPoligonos("f1", { type: "FeatureCollection", features: [] });

    await cotacao.buscarCotacaoDolar();
    await cotacao.buscarCotacaoEuro();

    await lembreteService.criar({ titulo: "Teste" });
    await lembreteService.atualizar("l1", { titulo: "Novo" });
    await lembreteService.atualizarStatus("l1", "ENVIADO");
    await lembreteService.deletar("l1");

    await notificacaoService.marcarComoLida("n1");
    await notificacaoService.marcarTodasComoLidas();

    expect(api.patch).toHaveBeenCalledWith("/notificacoes/n1/lida");
    expect(api.post).toHaveBeenCalledWith("/poligonos/importar", expect.any(Object));
  });
});
