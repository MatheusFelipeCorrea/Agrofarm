/**
 * Consultas factuais — resposta direta do banco, sem Gemini (economia de tokens).
 * Perguntas analíticas/opinião ficam de fora e vão para a IA.
 */

export const CATALOGO_CONSULTAS_FACTUAIS = [
  {
    id: "estoque",
    exemplos: ["O que tenho no estoque?", "Quantas sacas na fazenda X?"],
    modulo: "Estoque / Colheitas",
  },
  {
    id: "lucro",
    exemplos: ["Quanto tenho de lucro?", "Receita da fazenda Y"],
    modulo: "Lucros",
  },
  {
    id: "gastos",
    exemplos: ["Quanto gastei no total?", "Despesas da fazenda X"],
    modulo: "Gastos",
  },
  {
    id: "saldo",
    exemplos: ["Qual meu saldo?", "Lucros menos gastos"],
    modulo: "Financeiro",
  },
  {
    id: "maior_gasto",
    exemplos: ["Qual meu maior gasto?", "Maior despesa registrada"],
    modulo: "Gastos",
  },
  {
    id: "gastos_pendentes",
    exemplos: ["Gastos pendentes", "O que tenho a pagar?"],
    modulo: "Gastos",
  },
  {
    id: "producao",
    exemplos: ["Produção por cultura", "Quantas sacas produzi de soja?"],
    modulo: "Colheitas",
  },
  {
    id: "colheitas",
    exemplos: ["Quantas colheitas cadastrei?", "Número de colheitas"],
    modulo: "Colheitas",
  },
  {
    id: "fazendas",
    exemplos: ["Quais minhas fazendas?", "Quantas fazendas tenho?"],
    modulo: "Fazendas",
  },
  {
    id: "movimentacoes",
    exemplos: ["Últimas movimentações", "Extrato recente"],
    modulo: "Lucros / Gastos",
  },
  {
    id: "lembretes",
    exemplos: ["Meus lembretes", "Lembretes pendentes"],
    modulo: "Lembretes",
  },
  {
    id: "insumos",
    exemplos: ["Últimos insumos", "O que apliquei de adubo?"],
    modulo: "Insumos",
  },
  {
    id: "mercado",
    exemplos: ["Cotação do dólar", "Preço da soja hoje"],
    modulo: "Mercado",
  },
  {
    id: "ranking_saldo",
    exemplos: ["Qual fazenda tem melhor saldo?", "Fazenda com maior lucro líquido"],
    modulo: "Financeiro",
  },
  {
    id: "hectares_culturas",
    exemplos: ["Hectares da fazenda X", "Culturas plantadas na fazenda Y"],
    modulo: "Fazendas",
  },
];

function formatarMoedaBR(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarDataBR(valor) {
  if (!valor) return "—";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

export function normalizarPergunta(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatarSacas(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function resolverFazendaNaPergunta(perguntaNorm, fazendas) {
  if (!fazendas?.length) return null;

  const ordenadas = [...fazendas].sort(
    (a, b) => normalizarPergunta(b.nome).length - normalizarPergunta(a.nome).length,
  );

  for (const f of ordenadas) {
    const nomeNorm = normalizarPergunta(f.nome);
    if (nomeNorm.length >= 3 && perguntaNorm.includes(nomeNorm)) return f;
  }

  const matchExplicito = perguntaNorm.match(/(?:na|da|de|em)\s+fazenda\s+([a-z0-9][a-z0-9\s\-]{1,48})/);
  const termo = matchExplicito?.[1]?.trim();
  if (!termo) return null;

  return (
    ordenadas.find((f) => {
      const nomeNorm = normalizarPergunta(f.nome);
      return nomeNorm.includes(termo) || termo.includes(nomeNorm);
    }) ?? null
  );
}

function ctxFinanceiro(ctx) {
  const g = ctx.resumoGeral ?? {};
  return {
    totalLucros: Number(g.totalLucros ?? ctx.totalLucros ?? 0),
    totalGastos: Number(g.totalGastos ?? ctx.totalGastos ?? 0),
    saldo: Number(g.saldoAproximado ?? ctx.saldoAproximado ?? 0),
    colheitasTotal: Number(g.colheitasTotal ?? ctx.colheitasTotal ?? 0),
    gastosPendentes: g.gastosPendentes ?? { quantidade: 0, valorTotal: 0 },
  };
}

/** Perguntas que devem ir para a IA (análise, opinião, investimento, comparação estratégica). */
export function perguntaAnaliticaOuOpiniao(perguntaNorm) {
  if (
    /\b(devo|vale a pena|investir|investimento|opiniao|recomenda|sugere|estrategia|faz sentido|sera que|acha que|o que acha|merece|expandir|aumentar invest|priorizar|promissor|promissora|promissores)\b/.test(
      perguntaNorm,
    )
  ) {
    return true;
  }
  if (
    /\b(comparar|compare|comparacao|compara|comparando)\b/.test(perguntaNorm) &&
    /\b(fazenda|fazendas|cultura|investir|mercado|estrategia|priorizar|saldo|lucro|gasto)\b/.test(perguntaNorm)
  ) {
    return true;
  }
  if (/\b(comparar|compare|comparacao)\b/.test(perguntaNorm) && /\b(investir|mercado|estrategia|priorizar)\b/.test(perguntaNorm)) {
    return true;
  }
  if (/\b(priorizar|melhor|pior)\b/.test(perguntaNorm) && /\b(investir|onde|focar|mercado|gasto|fazenda)\b/.test(perguntaNorm)) {
    return true;
  }
  if (/\b(explique|analise|analisa|avalia|avaliar)\b/.test(perguntaNorm)) {
    return true;
  }
  return false;
}

export function perguntaExigeAnaliseCompleta(perguntaNorm) {
  if (perguntaAnaliticaOuOpiniao(perguntaNorm)) return true;
  if ((perguntaNorm.match(/\?/g) || []).length > 1) return true;
  if (/\b(e tambem|e também|alem disso|além disso|por outro lado)\b/.test(perguntaNorm)) return true;

  const temFactual = /\b(quanto|qual|quais|quantas|liste|mostre|tenho|cadastr)\b/.test(perguntaNorm);
  const temAnalitico = /\b(priorizar|comparar|compare|investir|recomenda|analise|analisa|explique|melhor|pior|onde focar|devo|promissor|motivo|por que|porque)\b/.test(
    perguntaNorm,
  );
  if (temFactual && temAnalitico) return true;

  if (perguntaNorm.length > 100 && /\b( e | ou | mas )\b/.test(perguntaNorm)) return true;

  return false;
}

function perguntaSobreEstoque(q) {
  return (
    /\b(estoque|em estoque|no estoque)\b/.test(q) ||
    (/\b(sacas)\b/.test(q) && /\b(tenho|quanto|qual|o que|oque|estoque)\b/.test(q) && !/\b(produzi|producao|produz)\b/.test(q))
  );
}

function perguntaSobreLucro(q) {
  return (
    /\b(lucro|lucros|receita|receitas|faturamento)\b/.test(q) &&
    !/\b(gasto|gastos|despesa|despesas)\b/.test(q) &&
    !/\b(saldo|sobrou)\b/.test(q)
  );
}

function perguntaSobreGastosTotal(q) {
  if (perguntaSobreMaiorGasto(q)) return false;
  return (
    /\b(gastos?|despesas?)\b/.test(q) &&
    /\b(quanto|total|tenho|gastei|some|soma)\b/.test(q)
  );
}

function perguntaSobreMaiorGasto(q) {
  return (
    (/\b(maior|mais alto|maxim[oa]|principal)\b/.test(q) && /\b(gasto|gastos|despesa|despesas)\b/.test(q)) ||
    /\bqual\s+(foi\s+)?(meu\s+)?(gasto|despesa)\b/.test(q)
  );
}

function perguntaSobreSaldo(q) {
  return /\b(saldo|sobrou|lucro liquido|resultado financeiro)\b/.test(q) && !perguntaSobreLucro(q);
}

function perguntaSobreGastosPendentes(q) {
  return (
    (/\b(pendentes?|a pagar|vencer|vencimento)\b/.test(q) && /\b(gastos?|despesas?)\b/.test(q)) ||
    /\bgastos?\s+pendentes?\b/.test(q)
  );
}

function perguntaSobreProducao(q) {
  return (
    /\b(producao|produzi|produzidas?|produtividade|sacas produzidas)\b/.test(q) ||
    (/\b(sacas)\b/.test(q) && /\b(produzi|producao|colh)\b/.test(q))
  );
}

function perguntaSobreColheitas(q) {
  return (
    /\b(quantas?|numero de|qts|total de)\b.*\b(colheitas?)\b/.test(q) ||
    /\b(colheitas?)\b.*\b(quantas?|cadastr)\b/.test(q)
  );
}

function perguntaSobreFazendas(q) {
  return (
    /\b(quais|listar|liste|mostre|minhas)\b.*\b(fazendas?)\b/.test(q) ||
    /\b(quantas?)\b.*\b(fazendas?)\b/.test(q) ||
    /\bfazendas?\s+(tenho|visiveis|cadastradas)\b/.test(q)
  );
}

function perguntaSobreMovimentacoes(q) {
  return /\b(ultim|recentes?|extrato|movimentacoes?|movimentacao)\b/.test(q) && /\b(financeir|lucro|gasto|venda)\b/.test(q);
}

function perguntaSobreLembretes(q) {
  return /\b(lembretes?|agenda|tarefas? pendentes?)\b/.test(q);
}

function perguntaSobreInsumos(q) {
  return /\b(insumos?|adubo|fertilizante|defensivo|semente)\b/.test(q) && /\b(ultim|recentes?|apliquei|cadastr)\b/.test(q);
}

function perguntaSobreMercado(q) {
  return (
    (/\b(dolar|euro|cambio|cotacao|preco|valor)\b/.test(q) &&
      /\b(soja|milho|cafe|trigo|algodao|commodit|mercado)\b/.test(q)) ||
    /\b(quanto\s+esta)\b.*\b(dolar|soja|milho)\b/.test(q) ||
    /\bcotacao\s+do\b/.test(q)
  );
}

function perguntaSobreCambio(q) {
  return (
    /\b(dolar|euro|cambio|usd|brl)\b/.test(q) &&
    /\b(cotacao|preco|valor|quanto|esta|taxa|câmbio|cambio)\b/.test(q) &&
    !/\b(investir|devo|recomenda|priorizar|compare|comparar|promissor)\b/.test(q) &&
    !/\b(soja|milho|cafe|trigo|algodao)\b/.test(q)
  );
}

function perguntaSobreRankingSaldo(q) {
  if (perguntaAnaliticaOuOpiniao(q)) return false;
  return (
    /\b(qual|quem)\b.*\b(fazenda)\b.*\b(maior|melhor|menor|pior)\b.*\b(saldo|lucro)\b/.test(q) ||
    /\b(fazenda)\b.*\b(maior|melhor)\b.*\b(saldo)\b/.test(q)
  );
}

function perguntaSobreHectaresCulturas(q) {
  return /\b(hectares?|ha\b|culturas? plantadas?|area plantada)\b/.test(q);
}

function respostaEstoque(ctx, fazendaAlvo) {
  const blocos = ctx.estoquePorFazenda ?? [];
  if (fazendaAlvo) {
    const bloco = blocos.find((b) => b.fazendaId === fazendaAlvo.id);
    if (!bloco?.itens?.length) {
      return `**Estoque — ${fazendaAlvo.nome}**\n\nNão há sacas registradas em colheitas para esta fazenda.`;
    }
    const linhas = bloco.itens.map(
      (i) =>
        `• **${i.cultura}**: ${formatarSacas(i.sacas)} sacas (última colheita ${formatarDataBR(i.ultimaColheita)})`,
    );
    return [`**Estoque — ${fazendaAlvo.nome}**`, "", ...linhas, "", `**Total:** ${formatarSacas(bloco.totalSacas)} sacas`].join("\n");
  }
  if (!blocos.length) return "**Estoque**\n\nNão há colheitas registradas nas fazendas visíveis.";
  const linhas = [];
  let totalGeral = 0;
  for (const bloco of blocos) {
    totalGeral += bloco.totalSacas;
    linhas.push(`\n**${bloco.fazendaNome}** — ${formatarSacas(bloco.totalSacas)} sacas`);
    for (const i of bloco.itens) linhas.push(`  • ${i.cultura}: ${formatarSacas(i.sacas)} sacas`);
  }
  return [`**Estoque (todas as fazendas)**`, ...linhas, "", `**Total geral:** ${formatarSacas(totalGeral)} sacas`].join("\n");
}

function respostaLucro(ctx, fazendaAlvo) {
  const finGeral = ctxFinanceiro(ctx);
  if (fazendaAlvo) {
    const fin = (ctx.financeiroPorFazenda ?? []).find((f) => f.fazendaId === fazendaAlvo.id);
    if (!fin) return `**Lucro — ${fazendaAlvo.nome}**\n\nSem movimentações financeiras vinculadas a colheitas.`;
    return [
      `**Lucro — ${fazendaAlvo.nome}**`,
      "",
      `• **Lucros (vendas):** ${formatarMoedaBR(fin.totalLucros)}`,
      `• **Gastos:** ${formatarMoedaBR(fin.totalGastos)}`,
      `• **Saldo:** ${formatarMoedaBR(fin.saldo)}`,
    ].join("\n");
  }
  const fin = ctx.financeiroPorFazenda ?? [];
  if (!fin.length) return "**Lucro**\n\nSem dados financeiros no seu escopo.";
  const linhas = fin.map(
    (f) =>
      `• **${f.fazendaNome}**: lucros ${formatarMoedaBR(f.totalLucros)} · gastos ${formatarMoedaBR(f.totalGastos)} · saldo ${formatarMoedaBR(f.saldo)}`,
  );
  return [
    "**Lucro por fazenda**",
    "",
    ...linhas,
    "",
    `**Total:** lucros ${formatarMoedaBR(finGeral.totalLucros)} · gastos ${formatarMoedaBR(finGeral.totalGastos)} · saldo ${formatarMoedaBR(finGeral.saldo)}`,
  ].join("\n");
}

function respostaGastos(ctx, fazendaAlvo) {
  if (fazendaAlvo) {
    const fin = (ctx.financeiroPorFazenda ?? []).find((f) => f.fazendaId === fazendaAlvo.id);
    if (!fin) return `**Gastos — ${fazendaAlvo.nome}**\n\nSem gastos registrados.`;
    return `**Gastos — ${fazendaAlvo.nome}**\n\n• **Total:** ${formatarMoedaBR(fin.totalGastos)}`;
  }
  const finGeral = ctxFinanceiro(ctx);
  return `**Gastos (todas as fazendas)**\n\n• **Total registrado:** ${formatarMoedaBR(finGeral.totalGastos)}`;
}

function respostaSaldo(ctx, fazendaAlvo) {
  if (fazendaAlvo) {
    const fin = (ctx.financeiroPorFazenda ?? []).find((f) => f.fazendaId === fazendaAlvo.id);
    if (!fin) return `**Saldo — ${fazendaAlvo.nome}**\n\nSem dados financeiros.`;
    return `**Saldo aproximado — ${fazendaAlvo.nome}**\n\n• Lucros − gastos = **${formatarMoedaBR(fin.saldo)}**`;
  }
  const finGeral = ctxFinanceiro(ctx);
  return [
    "**Saldo aproximado (todas as fazendas)**",
    "",
    `• Lucros: ${formatarMoedaBR(finGeral.totalLucros)}`,
    `• Gastos: ${formatarMoedaBR(finGeral.totalGastos)}`,
    `• **Saldo:** ${formatarMoedaBR(finGeral.saldo)}`,
  ].join("\n");
}

function respostaMaiorGasto(ctx, fazendaAlvo) {
  const candidatos = fazendaAlvo
    ? (ctx.maiorGastoPorFazenda ?? []).filter((g) => g.fazendaId === fazendaAlvo.id)
    : ctx.maiorGastoPorFazenda ?? [];
  const maior = candidatos.length
    ? candidatos.reduce((a, b) => (b.valor > a.valor ? b : a))
    : ctx.maiorGastoGlobal;
  if (!maior?.valor) {
    const escopo = fazendaAlvo ? `na fazenda **${fazendaAlvo.nome}**` : "no seu escopo";
    return `**Maior gasto**\n\nNão há gastos registrados ${escopo}.`;
  }
  const partes = [
    fazendaAlvo ? `**Maior gasto — ${fazendaAlvo.nome}**` : "**Maior gasto registrado**",
    "",
    `• **Valor:** ${formatarMoedaBR(maior.valor)}`,
    `• **Tipo:** ${maior.descricao}`,
    `• **Data:** ${formatarDataBR(maior.data)}`,
  ];
  if (maior.fazendaNome && !fazendaAlvo) partes.push(`• **Fazenda:** ${maior.fazendaNome}`);
  if (maior.culturaNome) partes.push(`• **Cultura:** ${maior.culturaNome}`);
  if (maior.status) partes.push(`• **Status:** ${maior.status}`);
  return partes.join("\n");
}

function respostaGastosPendentes(ctx) {
  const p = ctxFinanceiro(ctx).gastosPendentes;
  if (!p?.quantidade) return "**Gastos pendentes**\n\nNenhum gasto com status pendente no seu escopo.";
  return [
    "**Gastos pendentes**",
    "",
    `• **Quantidade:** ${p.quantidade}`,
    `• **Valor total:** ${formatarMoedaBR(p.valorTotal)}`,
  ].join("\n");
}

function respostaProducao(ctx, fazendaAlvo) {
  const prodFazenda = fazendaAlvo
    ? (ctx.producaoPorFazenda ?? []).find((p) => p.fazendaId === fazendaAlvo.id)
    : null;
  if (fazendaAlvo && prodFazenda?.culturas?.length) {
    const linhas = prodFazenda.culturas.map(
      (c) =>
        `• **${c.cultura}**: ${formatarSacas(c.sacas)} sacas · ${Number(c.area).toLocaleString("pt-BR")} ha · ~${c.produtividadeSacasPorHa.toFixed(1)} sacas/ha`,
    );
    return [
      `**Produção — ${fazendaAlvo.nome}**`,
      "",
      ...linhas,
      "",
      `**Total:** ${formatarSacas(prodFazenda.totalSacas)} sacas · ${formatarSacas(prodFazenda.totalArea)} ha`,
    ].join("\n");
  }
  const agregado = ctx.producaoPorCulturaAgregada ?? ctx.producaoPorCultura ?? [];
  if (!agregado.length) return "**Produção**\n\nSem colheitas registradas.";
  const linhas = agregado.map(
    (p) =>
      `• **${p.nome}**: ${formatarSacas(p.sacas)} sacas · ${Number(p.area).toLocaleString("pt-BR")} ha · produt. ~${Number(p.produtividade).toFixed(2)} sacas/ha`,
  );
  return ["**Produção por cultura (agregado)**", "", ...linhas].join("\n");
}

function respostaColheitas(ctx) {
  const n = ctxFinanceiro(ctx).colheitasTotal;
  return `**Colheitas cadastradas**\n\n• **Total de registros:** ${n} (no escopo das suas fazendas)`;
}

function respostaFazendas(ctx) {
  const lista = ctx.fazendas ?? [];
  if (!lista.length) return "**Fazendas**\n\nNenhuma fazenda visível para seu usuário.";
  const linhas = lista.map((f) => {
    const loc = f.localizacao ? ` · ${f.localizacao}` : "";
    const ha = f.hectaresTotais ? ` · ${formatarSacas(f.hectaresTotais)} ha` : "";
    return `• **${f.nome}**${ha}${loc}`;
  });
  return [`**Fazendas visíveis (${lista.length})**`, "", ...linhas].join("\n");
}

function respostaMovimentacoes(ctx) {
  const mov = ctx.ultimasMovimentacoesFinanceiras ?? ctx.ultimasMovimentacoes ?? [];
  if (!mov.length) return "**Movimentações recentes**\n\nNenhuma movimentação recente.";
  const linhas = mov.slice(0, 12).map((m) => {
    const sinal = m.tipo === "LUCRO" ? "+" : "−";
    return `• ${formatarDataBR(m.data)} — ${m.tipo} ${sinal} ${formatarMoedaBR(Math.abs(m.valor))} — ${m.descricao}`;
  });
  return ["**Últimas movimentações**", "", ...linhas].join("\n");
}

function respostaLembretes(ctx) {
  const lembretes = ctx.lembretesRecentes ?? [];
  if (!lembretes.length) return "**Lembretes**\n\nNenhum lembrete recente.";
  const linhas = lembretes.slice(0, 12).map((l) => {
    const faz = l.fazenda ? ` (${l.fazenda})` : "";
    return `• ${formatarDataBR(l.data ?? l.data_lembrete)} — **${l.status}** — ${l.titulo}${faz}`;
  });
  return ["**Lembretes recentes**", "", ...linhas].join("\n");
}

function respostaInsumos(ctx) {
  const ins = ctx.insumosRecentes ?? [];
  if (!ins.length) return "**Insumos**\n\nNenhum registro recente.";
  const linhas = ins.slice(0, 10).map((i) => {
    const total = i.valorTotal ?? Number(i.quantidade ?? 0) * Number(i.valorUnitario ?? i.valor_unitario ?? 0);
    const faz = i.fazenda ? `${i.fazenda} · ` : "";
    return `• ${formatarDataBR(i.data)} — ${faz}**${i.item}** (${i.quantidade} ${i.unidade}) · ~${formatarMoedaBR(total)}`;
  });
  return ["**Últimos insumos**", "", ...linhas].join("\n");
}

function respostaCambio(ctx) {
  const mercado = ctx.mercado ?? {};
  const linhas = [];
  if (mercado.dolar?.valor != null) {
    const v = mercado.dolar.variacao;
    const varTxt = v != null ? ` (${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%)` : "";
    linhas.push(`• **Dólar (USD/BRL):** ${formatarMoedaBR(mercado.dolar.valor)}${varTxt}`);
  }
  if (mercado.euro?.valor != null) {
    const v = mercado.euro.variacao;
    const varTxt = v != null ? ` (${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%)` : "";
    linhas.push(`• **Euro (EUR/BRL):** ${formatarMoedaBR(mercado.euro.valor)}${varTxt}`);
  }
  if (!linhas.length) return "**Câmbio**\n\nCotações indisponíveis no momento.";
  return ["**Câmbio (referência do painel AgroFarm)**", "", ...linhas].join("\n");
}

function respostaMercado(ctx) {
  const mercado = ctx.mercado ?? {};
  const linhas = [];
  if (mercado.dolar?.valor != null) {
    const v = mercado.dolar.variacao;
    const varTxt = v != null ? ` (${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%)` : "";
    linhas.push(`• **Dólar:** ${formatarMoedaBR(mercado.dolar.valor)}${varTxt}`);
  }
  if (mercado.euro?.valor != null) linhas.push(`• **Euro:** ${formatarMoedaBR(mercado.euro.valor)}`);
  for (const c of mercado.commodities ?? []) {
    if (c.valor == null) continue;
    const v = c.variacao;
    const varTxt = v != null ? ` (${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%)` : "";
    linhas.push(`• **${c.nome}:** ${c.valor} ${c.unidade ?? ""} ${c.moeda ?? ""}${varTxt}`.trim());
  }
  if (!linhas.length) return "**Mercado**\n\nCotações indisponíveis no momento.";
  return ["**Cotações de referência (painel AgroFarm)**", "", ...linhas, "", "_Futuros internacionais; preço na sua região pode diferir._"].join("\n");
}

function respostaRankingSaldo(ctx) {
  const comp = [...(ctx.comparativoFazendas ?? [])].sort((a, b) => b.saldo - a.saldo);
  if (!comp.length) return "**Ranking por saldo**\n\nSem dados financeiros por fazenda.";
  const linhas = comp.map((f, i) => {
    const sacas = f.totalSacas > 0 ? ` · ${formatarSacas(f.totalSacas)} sacas` : "";
    return `${i + 1}. **${f.fazendaNome}** — saldo ${formatarMoedaBR(f.saldo)}${sacas}`;
  });
  return ["**Fazendas por saldo (maior → menor)**", "", ...linhas].join("\n");
}

function respostaHectaresCulturas(ctx, fazendaAlvo) {
  if (fazendaAlvo) {
    const culturas = fazendaAlvo.culturasVinculadas ?? [];
    if (!culturas.length) {
      return `**${fazendaAlvo.nome}**\n\nNenhuma cultura vinculada. Cadastre em Fazendas.`;
    }
    const linhas = culturas.map(
      (c) => `• **${c.nome}**: ${formatarSacas(c.hectares)} ha · status ${c.status ?? "—"}`,
    );
    return [
      `**Culturas — ${fazendaAlvo.nome}**`,
      "",
      ...linhas,
      "",
      `**Hectares totais:** ${formatarSacas(fazendaAlvo.hectaresTotais ?? 0)} ha`,
    ].join("\n");
  }
  const lista = ctx.fazendas ?? [];
  const linhas = lista.map((f) => {
    const cult = (f.culturasVinculadas ?? []).map((c) => c.nome).join(", ") || "—";
    return `• **${f.nome}**: ${formatarSacas(f.hectaresTotais ?? 0)} ha · culturas: ${cult}`;
  });
  return ["**Hectares e culturas por fazenda**", "", ...linhas].join("\n");
}

const HANDLERS_CONSULTA_RAPIDA = [
  { test: perguntaSobreEstoque, respond: respostaEstoque },
  { test: perguntaSobreMaiorGasto, respond: respostaMaiorGasto },
  { test: perguntaSobreLucro, respond: respostaLucro },
  { test: perguntaSobreGastosTotal, respond: respostaGastos },
  { test: perguntaSobreSaldo, respond: respostaSaldo },
  { test: perguntaSobreGastosPendentes, respond: respostaGastosPendentes },
  { test: perguntaSobreProducao, respond: respostaProducao },
  { test: perguntaSobreColheitas, respond: respostaColheitas },
  { test: perguntaSobreFazendas, respond: respostaFazendas },
  { test: perguntaSobreMovimentacoes, respond: respostaMovimentacoes },
  { test: perguntaSobreLembretes, respond: respostaLembretes },
  { test: perguntaSobreInsumos, respond: respostaInsumos },
  { test: perguntaSobreCambio, respond: respostaCambio },
  { test: perguntaSobreMercado, respond: respostaMercado },
  { test: perguntaSobreRankingSaldo, respond: respostaRankingSaldo },
  { test: perguntaSobreHectaresCulturas, respond: respostaHectaresCulturas },
];

/**
 * Tenta responder só com dados do banco. Retorna null → usar Gemini.
 */
export function tentarRespostaConsultaRapida(ctx, perguntaUsuario) {
  const q = normalizarPergunta(perguntaUsuario);
  if (perguntaExigeAnaliseCompleta(q)) return null;

  const fazendaAlvo = resolverFazendaNaPergunta(q, ctx.fazendas ?? []);

  for (const { test, respond } of HANDLERS_CONSULTA_RAPIDA) {
    if (!test(q)) continue;
    const corpo = respond(ctx, fazendaAlvo);
    if (corpo) return corpo;
  }

  return null;
}

export function listarCatalogoConsultasFactuais() {
  return CATALOGO_CONSULTAS_FACTUAIS;
}
