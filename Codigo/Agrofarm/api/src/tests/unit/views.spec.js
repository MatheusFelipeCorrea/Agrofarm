import { describe, expect, it } from "vitest";
import { culturaView } from "../../views/cultura.view.js";
import { fazendaView } from "../../views/fazenda.view.js";
import { insumoView } from "../../views/insumo.view.js";
import { usuarioView } from "../../views/usuario.view.js";
import { fazendaCulturaView } from "../../views/fazendaCultura.view.js";
import { lembreteView } from "../../views/lembrete.view.js";
import { notificacaoView } from "../../views/notificacao.view.js";
import { cotacaoView } from "../../views/cotacao.view.js";
import { estoqueView } from "../../views/estoque.view.js";
import { simulacaoView } from "../../views/simulacao.view.js";
import { noticiaView } from "../../views/noticia.view.js";
import { insightsView } from "../../views/insights.view.js";
import { chatbotView } from "../../views/chatbot.view.js";

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

  it("estoqueView renderLote, renderMany e renderResumo", () => {
    const lote = {
      colheitaId: "c1",
      lote: "L-2026",
      ano: 2026,
      dataColheita: new Date("2026-03-15"),
      fazenda: { id: "f1", nome: "Fazenda" },
      cultura: { id: "cu1", nome: "Soja" },
      produzidas: 100,
      vendidas: 40,
      emEstoque: 60,
      localizacao: "Silo A",
      ultimaMovimentacao: "2026-05-01",
      status: "EM_ESTOQUE",
    };
    const renderizado = estoqueView.renderLote(lote);
    expect(renderizado.dataColheita).toBe("2026-03-15");
    expect(estoqueView.renderMany([lote])).toHaveLength(1);
    expect(
      estoqueView.renderResumo({ totalEmEstoque: 60, totalVendido: 40, lotesEstoqueBaixo: 1 }),
    ).toEqual({ totalEmEstoque: 60, totalVendido: 40, lotesEstoqueBaixo: 1 });
  });

  it("estoqueView renderMovimentacoesRecentes e renderDetalhe", () => {
    const movs = [{ id: "m1", tipo: "ENTRADA", quantidadeSacas: 10, data: new Date("2026-05-01"), dataHora: null, descricao: "Colheita" }];
    expect(estoqueView.renderMovimentacoesRecentes(movs)).toBe(movs);
    const detalhe = estoqueView.renderDetalhe({
      colheitaId: "c1",
      lote: "L-1",
      ano: 2026,
      dataColheita: "2026-03-01",
      movimentacoes: movs,
    });
    expect(detalhe.movimentacoes[0].data).toBe("2026-05-01");
  });

  it("estoqueView renderEntregaArrendamento marca vencida quando PENDENTE e data passada", () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(12, 0, 0, 0);

    const vencida = estoqueView.renderEntregaArrendamento({
      id: "e1",
      fazenda_id: "f1",
      fazendas: { id: "f1", nome: "Arrendada" },
      culturas: { id: "cu1", nome: "Milho", cor: "#ff0" },
      quantidade_sacas: 50,
      data: ontem,
      status: "PENDENTE",
      colheita_id: null,
    });
    expect(vencida.vencida).toBe(true);
    expect(vencida.quantidadeSacas).toBe(50);
    expect(vencida.fazenda.nome).toBe("Arrendada");

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 5);
    const futura = estoqueView.renderEntregaArrendamento({
      id: "e2",
      fazenda_id: "f1",
      quantidade_sacas: 10,
      data: amanha,
      status: "PENDENTE",
    });
    expect(futura.vencida).toBe(false);

    const semData = estoqueView.renderEntregaArrendamento({
      id: "e3",
      fazenda_id: "f1",
      quantidade_sacas: 5,
      data: null,
      status: "PENDENTE",
    });
    expect(semData.vencida).toBe(false);

    const concluida = estoqueView.renderEntregaArrendamento({
      id: "e4",
      fazenda_id: "f1",
      quantidade_sacas: 5,
      data: ontem,
      status: "ENTREGUE",
    });
    expect(concluida.vencida).toBe(false);
  });

  it("estoqueView renderArrendamentosPendentes mapeia lista", () => {
    const resultado = estoqueView.renderArrendamentosPendentes([
      { id: "e1", fazenda_id: "f1", quantidade_sacas: 3, data: null, status: "PENDENTE" },
    ]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("e1");
    expect(estoqueView.renderArrendamentosPendentes(null)).toEqual([]);
  });

  it("simulacaoView renderDividas, renderCalculo e renderHistorico", () => {
    const dividas = simulacaoView.renderDividas({
      escopo: "fazenda",
      totais: { totalPago: "100", totalPendente: 200, totalGasto: 300 },
      lucro: { totalLucro: 50 },
    });
    expect(dividas.totalDivida).toBe(200);
    expect(dividas.lucroRegistrado).toBe(50);

    const calculo = simulacaoView.renderCalculo({
      escopo: "global",
      linhas: [
        {
          cultura: "Soja",
          quantidadeSacas: 10,
          valorSaca: 150,
          cotacao: { moeda: "USD", valorAtual: 5.2, valorUsado: 5, indiceAplicado: 1 },
          resultado: { valorBruto: 1500, taxasEImpostos: 100, valorLiquido: 1400 },
          composicaoTaxas: { percentual: 5 },
        },
      ],
      isExportacao: true,
      cultura: "Soja",
      quantidadeSacas: 10,
      valorSaca: 150,
      cotacao: { valorAtual: 5.2 },
      lucro: { registrado: 100, simuladoLiquido: 1400 },
      resultado: { valorBruto: 1500, valorLiquido: 1400, abatimentoAplicado: 50 },
      composicaoTaxas: {
        cenarioMultiplo: true,
        linhas: [],
        percentual: 5,
        itens: [{ nome: "ICMS", percentual: 3, valor: 45 }],
        fonte: "ibpt",
        ncm: "1201",
        uf: "MG",
      },
      calculadoEm: "2026-06-01T10:00:00.000Z",
    });
    expect(calculo.linhas[0].quantidadeSacas).toBe(10);
    expect(calculo.linhas[0].cotacao.valorUsado).toBe(5);
    expect(calculo.composicaoTaxas.itens[0].valor).toBe(45);
    expect(calculo.composicaoTaxas.cenarioMultiplo).toBe(true);

    const historico = simulacaoView.renderHistorico([
      {
        id: "s1",
        cultura_id: "c1",
        culturas: { nome: "Soja" },
        fazenda_id: "f1",
        fazendas: { nome: "Fazenda 1" },
        quantidade_sacas: 20,
        valor_saca: 140,
        moeda: "BRL",
        valor_bruto: 2800,
        valor_liquido: 2500,
        abatimento_divida: 100,
        novo_saldo_divida: 400,
        composicao_taxas: {},
        criado_em: new Date("2026-05-01"),
      },
    ]);
    expect(historico[0].cultura).toBe("Soja");
    expect(historico[0].quantidadeSacas).toBe(20);
    expect(simulacaoView.renderHistorico(null)).toEqual([]);
  });

  it("noticiaView renderListagem formata datas e itens", () => {
    const dataPub = new Date("2026-05-10T12:00:00.000Z");
    const listagem = noticiaView.renderListagem({
      destaque: {
        id: "n1",
        titulo: "Chuva no Sul",
        descricao: "Previsão",
        link: "https://exemplo.com",
        categoria: "CLIMA",
        dataPublicacao: dataPub,
        minutosLeitura: 3,
        fonte: "AgroNews",
      },
      items: [],
      meta: { total: 1 },
      temas: ["clima"],
      fontes: ["AgroNews"],
      categorias: ["CLIMA"],
      atualizadoEm: dataPub,
    });
    expect(listagem.destaque.titulo).toBe("Chuva no Sul");
    expect(listagem.destaque.dataFormatada).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(listagem.atualizadoEm).toBe(dataPub.toISOString());
  });

  it("insightsView renderPainel e renderRefresh", () => {
    const geradoEm = new Date("2026-06-01T08:00:00.000Z");
    const card = {
      tipo: "estoque",
      titulo: "Estoque",
      texto: "Baixo",
      recomendacao: "Repor",
      dados: { sacas: 10 },
      escopo: "fazenda",
      escopoLabel: "Fazenda 1",
      insuficiente: false,
      origem: "sistema",
      geradoEm,
      atualizavel: true,
    };
    const painel = insightsView.renderPainel({
      escopo: "fazenda",
      escopoLabel: "Fazenda 1",
      fazendaId: "f1",
      geminiDisponivel: true,
      intervaloAutoMinutos: 30,
      saudacao: card,
      estoque: card,
      lucros: null,
      analiseFazendas: card,
      fazendaFixa: null,
      dicaDia: card,
    });
    expect(painel.saudacao.geradoEm).toBe(geradoEm.toISOString());
    expect(painel.saudacao.atualizavel).toBe(true);
    expect(painel.lucros).toBeNull();

    const refresh = insightsView.renderRefresh({ atualizados: [card] });
    expect(refresh.atualizados[0].titulo).toBe("Estoque");
  });

  it("chatbotView renderiza sessoes, mensagens e resumo", () => {
    const criado = new Date("2026-05-01T10:00:00.000Z");
    const sessao = chatbotView.renderSessao({
      id: "s1",
      titulo: "Dúvidas",
      criado_em: criado,
      atualizado_em: criado,
    });
    expect(sessao.criadoEm).toBe(criado.toISOString());

    const mensagem = chatbotView.renderMensagem({
      id: "m1",
      papel: "assistant",
      conteudo: "Olá",
      criado_em: criado,
      metadados: { fonteResposta: "gemini" },
    });
    expect(mensagem.fonteResposta).toBe("gemini");

    expect(chatbotView.renderManySessoes([{ id: "s1", titulo: "A", criado_em: criado, atualizado_em: criado }])).toHaveLength(1);
    expect(chatbotView.renderManyMensagens([{ id: "m1", papel: "user", conteudo: "Oi", criado_em: criado }])).toHaveLength(1);

    const resumo = chatbotView.renderResumoPainel({
      fazendas: [{ id: "f1", nome: "Fazenda" }],
      resumoGeral: {
        colheitasTotal: 5,
        totalLucros: 1000,
        totalGastos: 400,
        saldoAproximado: 600,
        gastosPendentes: { quantidade: 2, valorTotal: 150 },
      },
    });
    expect(resumo.fazendas[0].nome).toBe("Fazenda");
    expect(resumo.gastosPendentes.valorTotal).toBe(150);
  });
});
