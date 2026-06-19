import { prisma } from "../database/client.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { cotacaoService } from "./cotacao.service.js";

const LIMITE_LISTAS = 25;

const MODULOS_AGROFARM = [
  { modulo: "Dashboard", rota: "/", paraQueServe: "Indicadores gerais, gráficos e visão consolidada." },
  { modulo: "Fazendas", rota: "/fazendas", paraQueServe: "Cadastro de propriedades, localização e culturas vinculadas." },
  { modulo: "Gastos", rota: "/gastos", paraQueServe: "Despesas ligadas a colheitas; status pago/pendente." },
  { modulo: "Lucros", rota: "/lucros", paraQueServe: "Vendas e receitas por colheita." },
  { modulo: "Estoque", rota: "/estoque", paraQueServe: "Sacas em estoque derivadas das colheitas." },
  { modulo: "Colheitas", rota: "/colheitas", paraQueServe: "Produção por safra: sacas, área, cultura e fazenda." },
  { modulo: "Insumos", rota: "/insumos", paraQueServe: "Atividades e insumos aplicados por fazenda." },
  { modulo: "Lembretes", rota: "/lembretes", paraQueServe: "Agenda e tarefas com ou sem fazenda vinculada." },
  { modulo: "Chat IA", rota: "/chatbot", paraQueServe: "Este assistente — consultas e análises sobre seus dados." },
  { modulo: "Insights Inteligentes", rota: "/insights", paraQueServe: "Painéis analíticos automáticos do sistema." },
  { modulo: "Usuários", rota: "/usuarios", paraQueServe: "Gestão de acessos (somente administradores)." },
];

const ALIASES_CULTURA_COMMODITY = [
  { cultura: ["soja"], commodityIds: ["soja"] },
  { cultura: ["milho"], commodityIds: ["milho"] },
  { cultura: ["cafe", "café"], commodityIds: ["cafe"] },
  { cultura: ["trigo"], commodityIds: ["trigo"] },
  { cultura: ["algodao", "algodão"], commodityIds: ["algodao"] },
];

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolverCommodityDaCultura(nomeCultura, commodities) {
  const nomeNorm = normalizarTexto(nomeCultura);
  if (!nomeNorm || !commodities?.length) return null;

  for (const c of commodities) {
    const idNorm = normalizarTexto(c.id);
    const nomeComm = normalizarTexto(c.nome);
    if (nomeNorm.includes(idNorm) || (nomeComm && nomeNorm.includes(nomeComm))) {
      return c;
    }
  }

  for (const mapa of ALIASES_CULTURA_COMMODITY) {
    if (mapa.cultura.some((alias) => nomeNorm.includes(normalizarTexto(alias)))) {
      return commodities.find((c) => mapa.commodityIds.includes(normalizarTexto(c.id))) ?? null;
    }
  }

  return null;
}

function withFazendaFiltro(fazendaIds) {
  if (!Array.isArray(fazendaIds) || fazendaIds.length === 0) return {};
  return { fazenda_id: { in: fazendaIds } };
}

function num(valor) {
  return Number(valor ?? 0);
}

async function buscarFazendasDetalhadas(fazendaIds) {
  if (!fazendaIds.length) return [];

  const rows = await prisma.fazendas.findMany({
    where: { id: { in: fazendaIds } },
    select: {
      id: true,
      nome: true,
      tipo: true,
      localizacao: true,
      fazenda_culturas: {
        where: { deletado_em: null },
        select: {
          hectares: true,
          status: true,
          culturas: { select: { nome: true } },
        },
      },
      _count: {
        select: { colheitas: true, poligonos: true, lembretes: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return rows.map((f) => {
    const hectaresTotais = f.fazenda_culturas.reduce((acc, v) => acc + num(v.hectares), 0);
    return {
      id: f.id,
      nome: f.nome,
      tipo: f.tipo,
      localizacao: f.localizacao,
      hectaresTotais,
      culturasVinculadas: f.fazenda_culturas.map((v) => ({
        nome: v.culturas?.nome ?? "—",
        hectares: num(v.hectares),
        status: v.status,
      })),
      totalColheitas: f._count.colheitas,
      totalPoligonos: f._count.poligonos,
      totalLembretes: f._count.lembretes,
    };
  });
}

async function producaoPorFazenda({ fazendaIds }) {
  const grouped = await prisma.colheitas.groupBy({
    by: ["fazenda_id", "cultura_id"],
    where: withFazendaFiltro(fazendaIds),
    _sum: { sacas_produzidas: true, area: true },
    _max: { data_colheita: true },
  });

  if (!grouped.length) return [];

  const [fazendas, culturas] = await Promise.all([
    prisma.fazendas.findMany({
      where: { id: { in: [...new Set(grouped.map((r) => r.fazenda_id))] } },
      select: { id: true, nome: true },
    }),
    prisma.culturas.findMany({
      where: { id: { in: [...new Set(grouped.map((r) => r.cultura_id))] } },
      select: { id: true, nome: true },
    }),
  ]);

  const fazendaMap = new Map(fazendas.map((f) => [f.id, f.nome]));
  const culturaMap = new Map(culturas.map((c) => [c.id, c.nome]));
  const porFazenda = new Map();

  for (const row of grouped) {
    const sacas = num(row._sum.sacas_produzidas);
    const area = num(row._sum.area);
    if (!porFazenda.has(row.fazenda_id)) {
      porFazenda.set(row.fazenda_id, {
        fazendaId: row.fazenda_id,
        fazendaNome: fazendaMap.get(row.fazenda_id) ?? "Fazenda",
        culturas: [],
        totalSacas: 0,
        totalArea: 0,
      });
    }
    const bloco = porFazenda.get(row.fazenda_id);
    bloco.culturas.push({
      cultura: culturaMap.get(row.cultura_id) ?? "Cultura",
      sacas,
      area,
      produtividadeSacasPorHa: area > 0 ? sacas / area : 0,
      ultimaColheita: row._max.data_colheita,
    });
    bloco.totalSacas += sacas;
    bloco.totalArea += area;
  }

  return [...porFazenda.values()].map((b) => ({
    ...b,
    produtividadeMedia: b.totalArea > 0 ? b.totalSacas / b.totalArea : 0,
  }));
}

async function ultimasColheitas({ fazendaIds, limite = LIMITE_LISTAS }) {
  return prisma.colheitas.findMany({
    where: withFazendaFiltro(fazendaIds),
    orderBy: [{ data_colheita: "desc" }, { criado_em: "desc" }],
    take: limite,
    select: {
      sacas_produzidas: true,
      area: true,
      ano: true,
      data_colheita: true,
      fazendas: { select: { nome: true } },
      culturas: { select: { nome: true } },
    },
  }).then((rows) =>
    rows.map((r) => ({
      fazenda: r.fazendas?.nome,
      cultura: r.culturas?.nome,
      sacas: num(r.sacas_produzidas),
      area: num(r.area),
      ano: r.ano,
      data: r.data_colheita,
    })),
  );
}

async function ultimosLucros({ fazendaIds, limite = LIMITE_LISTAS }) {
  const rows = await prisma.lucros.findMany({
    where: { colheitas: withFazendaFiltro(fazendaIds) },
    orderBy: [{ data: "desc" }, { criado_em: "desc" }],
    take: limite,
    include: {
      colheitas: {
        include: {
          fazendas: { select: { nome: true } },
          culturas: { select: { nome: true } },
        },
      },
    },
  });

  return rows.map((l) => ({
    fazenda: l.colheitas?.fazendas?.nome,
    cultura: l.colheitas?.culturas?.nome,
    comprador: l.comprador,
    sacas: num(l.quantidade_sacas),
    valorUnitario: num(l.valor_unitario),
    valorTotal: num(l.quantidade_sacas) * num(l.valor_unitario),
    data: l.data,
  }));
}

async function ultimosGastos({ fazendaIds, limite = LIMITE_LISTAS }) {
  const rows = await prisma.gastos.findMany({
    where: { colheitas: withFazendaFiltro(fazendaIds) },
    orderBy: [{ data: "desc" }, { criado_em: "desc" }],
    take: limite,
    include: {
      colheitas: {
        include: {
          fazendas: { select: { nome: true } },
          culturas: { select: { nome: true } },
        },
      },
    },
  });

  return rows.map((g) => ({
    fazenda: g.colheitas?.fazendas?.nome,
    cultura: g.colheitas?.culturas?.nome,
    tipo: g.tipo_personalizado || g.tipo,
    valor: num(g.valor),
    status: g.status,
    data: g.data,
    dataVencimento: g.data_vencimento,
    descricao: g.descricao,
  }));
}

async function gastosPorTipo({ fazendaIds }) {
  const gastos = await prisma.gastos.findMany({
    where: { colheitas: withFazendaFiltro(fazendaIds) },
    select: { tipo: true, tipo_personalizado: true, valor: true },
  });

  const mapa = new Map();
  for (const g of gastos) {
    const chave = g.tipo_personalizado || g.tipo || "Outro";
    mapa.set(chave, (mapa.get(chave) ?? 0) + num(g.valor));
  }

  return [...mapa.entries()]
    .map(([tipo, valor]) => ({ tipo, valor }))
    .sort((a, b) => b.valor - a.valor);
}

async function resumoGastosPendentes({ fazendaIds }) {
  const pendentes = await prisma.gastos.findMany({
    where: {
      colheitas: withFazendaFiltro(fazendaIds),
      status: "PENDENTE",
    },
    select: { valor: true },
  });

  return {
    quantidade: pendentes.length,
    valorTotal: pendentes.reduce((acc, g) => acc + num(g.valor), 0),
  };
}

function montarComparativoFazendas(financeiroPorFazenda, producaoPorFazenda) {
  const prodMap = new Map(producaoPorFazenda.map((p) => [p.fazendaId, p]));

  return [...financeiroPorFazenda]
    .map((f) => {
      const prod = prodMap.get(f.fazendaId);
      const margem = f.totalLucros > 0 ? (f.saldo / f.totalLucros) * 100 : null;
      return {
        fazendaId: f.fazendaId,
        fazendaNome: f.fazendaNome,
        totalLucros: f.totalLucros,
        totalGastos: f.totalGastos,
        saldo: f.saldo,
        margemPercentualAprox: margem,
        totalSacas: prod?.totalSacas ?? 0,
        produtividadeMedia: prod?.produtividadeMedia ?? 0,
        retornoPorSaca: prod?.totalSacas > 0 ? f.saldo / prod.totalSacas : null,
      };
    })
    .sort((a, b) => b.saldo - a.saldo);
}

function montarCulturaVsMercado(fazendas, producaoPorCulturaAgregada, mercado) {
  const commodities = mercado?.commodities ?? [];
  const nomes = new Set();

  for (const f of fazendas) {
    for (const c of f.culturasVinculadas ?? []) {
      if (c.nome) nomes.add(c.nome);
    }
    for (const item of f.producao?.culturas ?? []) {
      if (item.cultura) nomes.add(item.cultura);
    }
  }
  for (const p of producaoPorCulturaAgregada ?? []) {
    if (p.nome) nomes.add(p.nome);
  }

  return [...nomes].map((cultura) => {
    const cotacao = resolverCommodityDaCultura(cultura, commodities);
    return {
      cultura,
      cotacaoFuturos: cotacao
        ? {
            nome: cotacao.nome,
            valor: cotacao.valor,
            variacaoPercentual: cotacao.variacao,
            unidade: cotacao.unidade,
            moeda: cotacao.moeda,
            fonte: cotacao.fonte,
            atualizadoEm: cotacao.atualizadoEm,
          }
        : null,
      observacao: cotacao
        ? "Futuro internacional de referência; preço físico na sua região pode diferir."
        : "Cultura sem cotação mapeada no painel — use tendências gerais com cautela.",
    };
  });
}

function montarSinaisPorFazenda(fazendas, comparativoFazendas, gastosPendentes) {
  const compMap = new Map(comparativoFazendas.map((c) => [c.fazendaId, c]));
  const mediaSacas =
    comparativoFazendas.length > 0
      ? comparativoFazendas.reduce((acc, c) => acc + num(c.totalSacas), 0) / comparativoFazendas.length
      : 0;

  return fazendas.map((f) => {
    const fin = f.financeiro;
    const prod = f.producao;
    const comp = compMap.get(f.id);
    const positivos = [];
    const alertas = [];

    if (fin) {
      if (num(fin.saldo) > 0) positivos.push(`Saldo positivo de aprox. R$ ${num(fin.saldo).toFixed(0)}`);
      if (num(fin.saldo) < 0) alertas.push(`Saldo negativo de aprox. R$ ${num(fin.saldo).toFixed(0)}`);
      if (num(fin.totalGastos) > num(fin.totalLucros) && num(fin.totalLucros) > 0) {
        alertas.push("Gastos superam lucros registrados nesta fazenda");
      }
      if (num(fin.totalLucros) === 0 && num(fin.totalGastos) > 0) {
        alertas.push("Há gastos cadastrados mas pouco ou nenhum lucro vinculado");
      }
    } else {
      alertas.push("Sem movimentação financeira vinculada a colheitas");
    }

    if (prod?.totalSacas > 0) {
      if (mediaSacas > 0 && prod.totalSacas >= mediaSacas * 1.1) {
        positivos.push(`Produção acima da média das suas fazendas (~${formatarNum(prod.totalSacas)} sacas)`);
      }
      if (mediaSacas > 0 && prod.totalSacas < mediaSacas * 0.5) {
        alertas.push(`Produção abaixo da média das suas fazendas (~${formatarNum(prod.totalSacas)} sacas)`);
      }
      if (prod.produtividadeMedia > 0) {
        positivos.push(`Produtividade média ~${prod.produtividadeMedia.toFixed(1)} sacas/ha`);
      }
    } else {
      alertas.push("Pouca ou nenhuma colheita registrada");
    }

    if (f.estoque?.totalSacas > 0) {
      positivos.push(`Estoque de ${formatarNum(f.estoque.totalSacas)} sacas disponível`);
    }

    if (gastosPendentes?.quantidade > 0) {
      alertas.push(
        `Existem ${gastosPendentes.quantidade} gasto(s) pendente(s) no escopo (total ~R$ ${num(gastosPendentes.valorTotal).toFixed(0)})`,
      );
    }

    const ranking = comparativoFazendas.findIndex((c) => c.fazendaId === f.id);
    const posicaoSaldo =
      ranking >= 0 ? ranking + 1 : null;

    return {
      fazendaId: f.id,
      fazendaNome: f.nome,
      posicaoSaldoEntreFazendas: posicaoSaldo,
      totalFazendasComparadas: comparativoFazendas.length,
      margemPercentualAprox: comp?.margemPercentualAprox ?? null,
      pontosPositivos: positivos,
      alertas,
    };
  });
}

function formatarNum(v) {
  return Number(v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function enriquecerFazendas(fazendasDetalhadas, financeiro, estoque, producao) {
  const finMap = new Map(financeiro.map((f) => [f.fazendaId, f]));
  const estMap = new Map(estoque.map((e) => [e.fazendaId, e]));
  const prodMap = new Map(producao.map((p) => [p.fazendaId, p]));

  return fazendasDetalhadas.map((f) => ({
    ...f,
    financeiro: finMap.get(f.id) ?? null,
    estoque: estMap.get(f.id) ?? null,
    producao: prodMap.get(f.id) ?? null,
  }));
}

/**
 * Contexto rico para o assistente IA — todas as informações operacionais visíveis ao usuário.
 */
export async function montarContextoCompleto(usuario) {
  const fazendasBasicas = await dashboardRepository.listarFazendasVisiveis(usuario);
  const fazendaIds = fazendasBasicas.map((f) => f.id);

  const colheitaFilter = withFazendaFiltro(fazendaIds);

  const [
    fazendasDetalhadas,
    producaoPorCultura,
    estoquePorCultura,
    estoquePorFazenda,
    producaoPorFazendaLista,
    financeiroPorFazenda,
    maiorGastoGlobal,
    ultimasMovimentacoes,
    cambio,
    mercado,
    totalLucros,
    totalGastos,
    colheitasTotal,
    lembretesRecentes,
    insumosRecentes,
    colheitasRecentes,
    lucrosRecentes,
    gastosRecentes,
    gastosTipo,
    gastosPendentes,
  ] = await Promise.all([
    buscarFazendasDetalhadas(fazendaIds),
    fazendaIds.length ? dashboardRepository.producaoPorCultura({ fazendaIds }) : [],
    fazendaIds.length ? dashboardRepository.estoquePorCultura({ fazendaIds }) : [],
    fazendaIds.length ? dashboardRepository.estoquePorFazenda({ fazendaIds }) : [],
    fazendaIds.length ? producaoPorFazenda({ fazendaIds }) : [],
    fazendaIds.length ? dashboardRepository.financeiroPorFazenda({ fazendaIds }) : [],
    fazendaIds.length ? dashboardRepository.buscarMaiorGasto({ fazendaIds }) : null,
    fazendaIds.length ? dashboardRepository.extratoRecente({ fazendaIds, limite: 20 }) : [],
    cotacaoService.buscarDolar().catch(() => null),
    cotacaoService.buscarPainelMercado().catch(() => null),
    fazendaIds.length ? dashboardRepository.totalLucros({ fazendaIds }) : 0,
    fazendaIds.length ? dashboardRepository.totalGastos({ fazendaIds }) : 0,
    fazendaIds.length ? prisma.colheitas.count({ where: colheitaFilter }) : 0,
    prisma.lembretes.findMany({
      where: {
        usuario_id: usuario.id,
        OR:
          fazendaIds.length > 0
            ? [{ fazenda_id: null }, { fazenda_id: { in: fazendaIds } }]
            : [{ fazenda_id: null }],
      },
      orderBy: { data_lembrete: "desc" },
      take: 15,
      select: {
        titulo: true,
        descricao: true,
        data_lembrete: true,
        status: true,
        fazendas: { select: { nome: true } },
      },
    }),
    fazendaIds.length
      ? prisma.insumos_atividades.findMany({
          where: { fazenda_id: { in: fazendaIds } },
          orderBy: { data: "desc" },
          take: 20,
          select: {
            item: true,
            quantidade: true,
            unidade: true,
            valor_unitario: true,
            data: true,
            categoria: true,
            fornecedor: true,
            fazendas: { select: { nome: true } },
          },
        })
      : [],
    fazendaIds.length ? ultimasColheitas({ fazendaIds }) : [],
    fazendaIds.length ? ultimosLucros({ fazendaIds }) : [],
    fazendaIds.length ? ultimosGastos({ fazendaIds }) : [],
    fazendaIds.length ? gastosPorTipo({ fazendaIds }) : [],
    fazendaIds.length ? resumoGastosPendentes({ fazendaIds }) : { quantidade: 0, valorTotal: 0 },
  ]);

  const saldoAproximado = num(totalLucros) - num(totalGastos);

  const maiorGastoPorFazenda = fazendaIds.length
    ? (
        await Promise.all(
          fazendaIds.map(async (id) => {
            const g = await dashboardRepository.buscarMaiorGasto({ fazendaIds, fazendaId: id });
            return g ? { ...g, fazendaId: id } : null;
          }),
        )
      ).filter(Boolean)
    : [];

  const comparativoFazendas = montarComparativoFazendas(financeiroPorFazenda, producaoPorFazendaLista);

  const fazendas = enriquecerFazendas(
    fazendasDetalhadas,
    financeiroPorFazenda,
    estoquePorFazenda,
    producaoPorFazendaLista,
  );

  const melhorSaldo = comparativoFazendas[0] ?? null;
  const piorSaldo = comparativoFazendas.length
    ? comparativoFazendas[comparativoFazendas.length - 1]
    : null;

  const culturaVsMercado = montarCulturaVsMercado(
    fazendas,
    producaoPorCultura,
    mercado ?? { dolar: cambio, commodities: [] },
  );
  const sinaisPorFazenda = montarSinaisPorFazenda(fazendas, comparativoFazendas, gastosPendentes);

  return {
    geradoEm: new Date().toISOString(),
    escopo:
      "Somente fazendas e registros que este usuario pode acessar no AgroFarm. Numeros sao fatos do banco; analises e recomendacoes sao interpretacao assistida por IA.",
    papelDoAssistente:
      "Assistente coringa: tira duvidas sobre o sistema AgroFarm, consulta dados do usuario e cruza com mercado (dolar/commodities) para analises e recomendacoes praticas — sempre com ressalva de nao ser consultoria formal.",
    usuario: { nome: usuario.nome, email: usuario.email, papel: usuario.role },
    resumoGeral: {
      totalFazendas: fazendas.length,
      colheitasTotal,
      totalLucros: num(totalLucros),
      totalGastos: num(totalGastos),
      saldoAproximado,
      gastosPendentes,
      fazendaMelhorSaldo: melhorSaldo
        ? { nome: melhorSaldo.fazendaNome, saldo: melhorSaldo.saldo }
        : null,
      fazendaMenorSaldo: piorSaldo
        ? { nome: piorSaldo.fazendaNome, saldo: piorSaldo.saldo }
        : null,
    },
    mercado: mercado ?? { dolar: cambio, commodities: [] },
    culturaVsMercado,
    sinaisPorFazenda,
    modulosAgroFarm: MODULOS_AGROFARM,
    fazendas,
    comparativoFazendas,
    producaoPorCulturaAgregada: producaoPorCultura,
    estoqueResumoAgregado: estoquePorCultura,
    estoquePorFazenda,
    financeiroPorFazenda,
    producaoPorFazenda: producaoPorFazendaLista,
    ultimasMovimentacoesFinanceiras: ultimasMovimentacoes,
    ultimasColheitas: colheitasRecentes,
    ultimosLucros: lucrosRecentes,
    ultimosGastos: gastosRecentes,
    gastosPorTipo: gastosTipo,
    maiorGastoGlobal,
    maiorGastoPorFazenda,
    lembretesRecentes: lembretesRecentes.map((l) => ({
      titulo: l.titulo,
      descricao: l.descricao,
      data: l.data_lembrete,
      status: l.status,
      fazenda: l.fazendas?.nome ?? null,
    })),
    insumosRecentes: insumosRecentes.map((i) => ({
      fazenda: i.fazendas?.nome,
      item: i.item,
      categoria: i.categoria,
      quantidade: num(i.quantidade),
      unidade: i.unidade,
      valorUnitario: num(i.valor_unitario),
      valorTotal: num(i.quantidade) * num(i.valor_unitario),
      fornecedor: i.fornecedor,
      data: i.data,
    })),
    capacidades: [
      "Duvidas sobre como usar modulos do AgroFarm (ver modulosAgroFarm)",
      "Consultar estoque, lucros, gastos, colheitas, lembretes e insumos",
      "Comparar fazendas e ranquear por saldo, sacas e produtividade",
      "Recomendar ou desaconselhar investimento em fazenda/cultura com motivos objetivos",
      "Cruzar culturas do usuario com cotacoes em culturaVsMercado e mercado.commodities",
      "Usar sinaisPorFazenda (pontosPositivos e alertas) como base para analises",
      "Opiniao de mercado contextualizada (futuros + dados internos do usuario)",
    ],
    formatoRecomendadoAnalise: {
      desaconselhar: "Nao recomendaria investir/priorizar [fazenda/cultura] porque: (1) ... (2) ... — considerando [dado de mercado se relevante].",
      promissor: "[Fazenda] na cultura [X] parece promissora porque: (1) ... (2) ... — commodity [nome] em [valor/variacao] como contexto de mercado.",
      ressalva: "Nao substitui consultoria financeira, juridica ou agronomica; valide na sua regiao.",
    },
  };
}
