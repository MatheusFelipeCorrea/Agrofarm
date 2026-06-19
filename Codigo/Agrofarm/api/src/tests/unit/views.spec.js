import { describe, expect, it } from "vitest";
import { culturaView } from "../../views/cultura.view.js";
import { fazendaView } from "../../views/fazenda.view.js";
import { insumoView } from "../../views/insumo.view.js";
import { usuarioView } from "../../views/usuario.view.js";
import { fazendaCulturaView } from "../../views/fazendaCultura.view.js";
import { lembreteView } from "../../views/lembrete.view.js";
import { notificacaoView } from "../../views/notificacao.view.js";
import { cotacaoView } from "../../views/cotacao.view.js";

describe("views", () => {
  it("culturaView render e renderMany", () => {
    const cultura = {
      id: "c1",
      nome: "Soja",
      cor: "#00ff00",
      hectares: { toNumber: () => 15.5 },
      criado_em: new Date("2026-01-01"),
    };
    expect(culturaView.render(cultura).hectares).toBe(15.5);
    expect(culturaView.renderMany([cultura])).toHaveLength(1);
  });

  it("fazendaView soma hectares dos vinculos", () => {
    const resultado = fazendaView.render({
      id: "f1",
      nome: "Fazenda",
      tipo: "PROPRIA",
      localizacao: "MG",
      criado_em: new Date(),
      atualizado_em: new Date(),
      fazenda_culturas: [
        {
          id: "v1",
          hectares: 10,
          status: "PLANTIO",
          criado_em: new Date(),
          culturas: { id: "c1", nome: "Soja", cor: "#0f0" },
        },
        { id: "v2", hectares: 5, status: "COLHEITA", criado_em: new Date(), culturas: null },
      ],
    });
    expect(resultado.hectares).toBe(15);
    expect(resultado.culturas).toHaveLength(2);
    expect(resultado.podeOperar).toBe(true);
    expect(resultado.somenteLeitura).toBe(false);
  });

  it('fazendaView marca ARRENDADA_PARA_TERCEIROS como somente leitura', () => {
    const resultado = fazendaView.render({
      id: 'f2',
      nome: 'Arrendada',
      tipo: 'ARRENDADA_PARA_TERCEIROS',
      localizacao: null,
      criado_em: new Date(),
      atualizado_em: new Date(),
      fazenda_culturas: [],
    });
    expect(resultado.podeOperar).toBe(false);
    expect(resultado.somenteLeitura).toBe(true);
  });

  it("insumoView calcula valorTotal e mediaDiaria", () => {
    const row = {
      id: "i1",
      data: new Date("2026-05-01"),
      item: "Adubo",
      categoria: "FERTILIZANTE",
      quantidade: 10,
      unidade: "kg",
      valor_unitario: 5,
      fornecedor: null,
      observacoes: null,
      funcionario_id: "u1",
      fazenda_id: "f1",
      usuarios: { nome: "João" },
      fazendas: { nome: "Fazenda 1" },
    };
    expect(insumoView.render(row).valorTotal).toBe(50);
    expect(insumoView.mediaDiaria(70, "2026-05-01", "2026-05-07")).toBe(10);
    expect(insumoView.renderMany([row])).toHaveLength(1);
  });

  it("usuarioView mapeia fazendas vinculadas", () => {
    const resultado = usuarioView.render({
      id: "u1",
      nome: "Admin",
      email: "a@b.com",
      role: "ADMIN",
      telefone: null,
      criado_em: new Date(),
      usuarios_fazendas: [{ fazendas: { id: "f1", nome: "Fazenda 1" } }],
    });
    expect(resultado.fazendasVinculadas[0].nome).toBe("Fazenda 1");
    expect(
      usuarioView.renderMany([
        {
          id: "u1",
          nome: "Admin",
          email: "a@b.com",
          role: "ADMIN",
          telefone: null,
          criado_em: new Date(),
          usuarios_fazendas: [],
        },
      ]),
    ).toHaveLength(1);
  });

  it("fazendaCulturaView render", () => {
    const resultado = fazendaCulturaView.render({
      id: "v1",
      fazenda_id: "f1",
      cultura_id: "c1",
      hectares: 20,
      status: "PLANTIO",
      criado_em: new Date(),
      culturas: { id: "c1", nome: "Milho", cor: "#ff0" },
    });
    expect(resultado.hectares).toBe(20);
    expect(resultado.cultura.nome).toBe("Milho");
  });

  it("lembreteView diferencia GASTO e LEMBRETE", () => {
    const lembrete = lembreteView.render({
      id: "l1",
      tipo: "LEMBRETE",
      usuario_id: "u1",
      fazenda_id: "f1",
      fazendas: { id: "f1", nome: "Fazenda" },
      titulo: "Irrigar",
      descricao: null,
      data_lembrete: new Date("2026-05-10T10:00:00"),
      telefone_whatsapp: "31999999999",
      recorrencia: "NENHUMA",
      criado_em: new Date(),
    });
    expect(lembrete.tipo).toBe("LEMBRETE");

    const gasto = lembreteView.render({
      id: "g1",
      tipo: "GASTO",
      fazenda_id: "f1",
      fazenda: { id: "f1", nome: "Fazenda" },
      titulo: "Pagamento",
      descricao: "Adubo",
      data_lembrete: new Date(),
      status: "PENDENTE",
      valor: 100,
    });
    expect(gasto.tipo).toBe("GASTO");
    expect(gasto.recorrencia).toBe("NENHUMA");
  });

  it("notificacaoView e cotacaoView renderMercado", () => {
    const notif = notificacaoView.render({
      id: "n1",
      tipo: "INSUMO_NOVO",
      titulo: "Novo insumo",
      descricao: "detalhe",
      rota: "/insumos",
      referencia_id: "i1",
      lida_em: null,
      criado_em: new Date(),
    });
    expect(notif.titulo).toBe("Novo insumo");

    const mercado = cotacaoView.renderMercado({
      dolar: { valor: 5, variacao: 0.1, fonte: "api", atualizadoEm: null },
      euro: null,
      commodities: [{ id: "soja", nome: "Soja", valor: "10", variacao: null, moeda: "USD", fonte: "y", atualizadoEm: null }],
    });
    expect(mercado.dolar.valor).toBe(5);
    expect(mercado.commodities[0].valor).toBe(10);
  });
});
