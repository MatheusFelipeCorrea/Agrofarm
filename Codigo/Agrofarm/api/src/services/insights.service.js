import { AppError } from "../shared/errors/AppError.js";
import { geminiInsightsDisponivel, invocarGeminiTexto } from "../shared/gemini/geminiClient.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { insightsRepository } from "../repositories/insights.repository.js";
import { cotacaoService } from "./cotacao.service.js";
import { INSTRUCAO_SISTEMA_INSIGHTS, montarPromptInsight } from "./insights.instructions.js";

const TIPOS_REFRESHAVEIS = ["ESTOQUE", "LUCROS"];
export const INTERVALO_AUTO_MS = 60 * 60 * 1000;

function assertAdmin(usuario) {
  if (usuario?.role !== "ADMIN") {
    throw new AppError("Acesso restrito a administradores", 403);
  }
}

async function resolverEscopo(usuario, fazendaIdParam) {
  const fazendas = await dashboardRepository.listarFazendasVisiveis(usuario);
  const fazendaIds = fazendas.map((f) => f.id);

  if (fazendaIdParam === "todas" || !fazendaIdParam) {
    return {
      escopo: "TODAS",
      fazendaId: null,
      fazendaIds,
      escopoLabel: "Todas as fazendas",
      fazendas,
    };
  }

  if (!fazendaIds.includes(fazendaIdParam)) {
    throw new AppError("Fazenda não encontrada", 404);
  }

  const fazenda = fazendas.find((f) => f.id === fazendaIdParam);
  return {
    escopo: "UNICA",
    fazendaId: fazendaIdParam,
    fazendaIds: [fazendaIdParam],
    escopoLabel: fazenda?.nome ?? "Fazenda",
    fazendas: fazenda ? [fazenda] : [],
  };
}

function inicioFimMesesReferencia() {
  const agora = new Date();
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  return { inicioMesAtual, inicioMesAnterior, fimMesAtual: new Date(agora.getFullYear(), agora.getMonth() + 1, 1) };
}

async function montarDadosBrutos({ escopo, fazendaIds, fazendas, usuario }) {
  const { inicioMesAtual, inicioMesAnterior, fimMesAtual } = inicioFimMesesReferencia();

  const [estoqueItens, lucroMesAtual, lucroMesAnterior, financeiroFazendas, estoqueFazendas, cotacaoDolar] =
    await Promise.all([
      insightsRepository.estoquePorCultura({ fazendaIds }),
      insightsRepository.somarLucrosNoPeriodo({ fazendaIds, inicio: inicioMesAtual, fim: fimMesAtual }),
      insightsRepository.somarLucrosNoPeriodo({ fazendaIds, inicio: inicioMesAnterior, fim: inicioMesAtual }),
      insightsRepository.gastosResumoPorFazenda({ fazendaIds }),
      dashboardRepository.estoquePorFazenda({ fazendaIds }),
      cotacaoService.buscarDolar().catch(() => null),
    ]);

  const maxEstoque = Math.max(...estoqueItens.map((i) => i.emEstoque), 1);
  const estoqueComPercentual = estoqueItens.map((i) => ({
    ...i,
    percentual: Math.round((i.emEstoque / maxEstoque) * 100),
  }));

  const variacaoLucro =
    lucroMesAnterior > 0 ? ((lucroMesAtual - lucroMesAnterior) / lucroMesAnterior) * 100 : lucroMesAtual > 0 ? 100 : 0;

  const fazendaDestaque =
    financeiroFazendas.find((f) => f.totalPendente === Math.max(...financeiroFazendas.map((x) => x.totalPendente), 0)) ??
    financeiroFazendas[0] ??
    null;

  let estoqueItensDestaque = [];
  if (fazendaDestaque?.fazendaId) {
    const itensFazenda = await insightsRepository.estoquePorCultura({
      fazendaIds: [fazendaDestaque.fazendaId],
    });
    estoqueItensDestaque = itensFazenda.map((i) => ({
      cultura: i.nome,
      sacas: i.emEstoque,
      cor: i.cor,
    }));
  }

  return {
    escopo,
    escopoLabel: escopo === "TODAS" ? "Todas as fazendas" : fazendas[0]?.nome ?? "Fazenda",
    usuarioNome: usuario?.nome ?? "Administrador",
    estoque: { itens: estoqueComPercentual, totalSacas: estoqueItens.reduce((a, i) => a + i.emEstoque, 0) },
    lucros: {
      mesAtual: lucroMesAtual,
      mesAnterior: lucroMesAnterior,
      variacaoPercentual: Number(variacaoLucro.toFixed(1)),
      tendencia: variacaoLucro > 2 ? "alta" : variacaoLucro < -2 ? "queda" : "estavel",
    },
    fazendas: financeiroFazendas.map((f) => ({
      ...f,
      estoqueItens: estoqueFazendas.find((e) => e.fazendaId === f.fazendaId)?.itens ?? [],
    })),
    fazendaDestaque: fazendaDestaque
      ? {
          ...fazendaDestaque,
          estoqueItens: estoqueItensDestaque,
          cotacaoDolar: cotacaoDolar?.valor ?? null,
        }
      : null,
    mercado: { dolar: cotacaoDolar },
  };
}

function textoFallback(tipo, dados) {
  const mapa = {
    SAUDACAO: `Olá, ${dados.usuarioNome?.split(" ")[0] ?? "admin"}! Tudo bem? Aqui estão os insights de hoje para ${dados.escopoLabel}.`,
    ESTOQUE:
      dados.estoque?.itens?.length > 0
        ? `Há ${dados.estoque.totalSacas.toLocaleString("pt-BR")} sacas em estoque no escopo ${dados.escopoLabel}. A cultura com maior volume é ${dados.estoque.itens[0].nome}.`
        : `Não há sacas em estoque registradas para ${dados.escopoLabel}.`,
    LUCROS: `Lucros do mês: R$ ${dados.lucros.mesAtual.toLocaleString("pt-BR")}. Mês anterior: R$ ${dados.lucros.mesAnterior.toLocaleString("pt-BR")} (${dados.lucros.variacaoPercentual >= 0 ? "+" : ""}${dados.lucros.variacaoPercentual}%).`,
    ANALISE_FAZENDAS:
      dados.fazendas?.length > 1
        ? `Foram analisadas ${dados.fazendas.length} fazendas. Revise pendências e oportunidades de venda por propriedade.`
        : `Cadastre mais fazendas para comparativos entre propriedades.`,
    FAZENDA_FIXA: dados.fazendaDestaque
      ? `${dados.fazendaDestaque.fazendaNome}: pendente R$ ${dados.fazendaDestaque.totalPendente.toLocaleString("pt-BR")}, pago R$ ${dados.fazendaDestaque.totalPago.toLocaleString("pt-BR")}.`
      : "Nenhuma fazenda disponível para análise detalhada.",
    DICA_DIA: "Monitore cotações e priorize vendas quando o mercado estiver favorável às culturas com maior estoque.",
  };
  return mapa[tipo] ?? "Insight indisponível no momento.";
}

function recomendacaoFallback(tipo, dados) {
  if (tipo === "ANALISE_FAZENDAS" && dados.fazendas?.length >= 2) {
    const pior = [...dados.fazendas].sort((a, b) => b.totalPendente - a.totalPendente)[0];
    const melhor = [...dados.fazendas].sort((a, b) => b.saldo - a.saldo)[0];
    return `A ${pior.fazendaNome} concentra pendências (R$ ${pior.totalPendente.toLocaleString("pt-BR")}). Considere reforçar investimentos em ${melhor.fazendaNome}, com melhor saldo no período.`;
  }
  if (tipo === "FAZENDA_FIXA" && dados.fazendaDestaque) {
    const fd = dados.fazendaDestaque;
    const principal = fd.estoqueItens?.[0];
    if (fd.totalPendente > 0 && principal) {
      const cot = fd.cotacaoDolar ? ` (cotação USD ~${Number(fd.cotacaoDolar).toFixed(2)})` : "";
      return `Para quitar R$ ${fd.totalPendente.toLocaleString("pt-BR")} pendentes, avalie vender parte do estoque de ${principal.cultura}${cot}.`;
    }
  }
  return null;
}

async function gerarConteudoInsight({ tipo, dados, forcarGemini }) {
  const insuficiente =
    (tipo === "ESTOQUE" && !dados.estoque?.itens?.length) ||
    (tipo === "LUCROS" && dados.lucros.mesAtual === 0 && dados.lucros.mesAnterior === 0);

  let texto = textoFallback(tipo, dados);
  let recomendacao = recomendacaoFallback(tipo, dados);
  let origem = "dados";

  if (forcarGemini && geminiInsightsDisponivel() && !insuficiente) {
    const prompt = montarPromptInsight({ tipo, contexto: dados, escopoLabel: dados.escopoLabel });
    const ia = await invocarGeminiTexto({ instrucaoSistema: INSTRUCAO_SISTEMA_INSIGHTS, promptUsuario: prompt });
    if (ia.ok && ia.texto) {
      texto = ia.texto;
      origem = "gemini";
    }
  }

  return {
    tipo,
    titulo: tituloPorTipo(tipo),
    texto,
    recomendacao,
    dados: dadosPorTipo(tipo, dados),
    escopo: dados.escopo,
    escopoLabel: dados.escopoLabel,
    insuficiente,
    origem,
  };
}

function tituloPorTipo(tipo) {
  const mapa = {
    SAUDACAO: "Boas-vindas",
    ESTOQUE: "Situação do Estoque",
    LUCROS: "Desempenho dos Lucros",
    ANALISE_FAZENDAS: "Análise das Fazendas",
    FAZENDA_FIXA: "Fazenda em destaque",
    DICA_DIA: "Dica do dia",
  };
  return mapa[tipo] ?? tipo;
}

function dadosPorTipo(tipo, dados) {
  if (tipo === "ESTOQUE") return { itens: dados.estoque.itens };
  if (tipo === "LUCROS") return { ...dados.lucros };
  if (tipo === "ANALISE_FAZENDAS") return { fazendas: dados.fazendas };
  if (tipo === "FAZENDA_FIXA") {
    return {
      fazenda: dados.fazendaDestaque,
      tituloFazenda: dados.fazendaDestaque?.fazendaNome ?? "Fazenda",
    };
  }
  if (tipo === "SAUDACAO") return { nome: dados.usuarioNome };
  return {};
}

async function montarFazendaDestaquePorId(dadosBrutos, fazendaId) {
  const f = dadosBrutos.fazendas?.find((x) => x.fazendaId === fazendaId);
  if (!f) {
    throw new AppError("Fazenda não encontrada", 404);
  }

  const itens = await insightsRepository.estoquePorCultura({ fazendaIds: [fazendaId] });
  const cotacaoValor = dadosBrutos.mercado?.dolar?.valor ?? dadosBrutos.fazendaDestaque?.cotacaoDolar ?? null;

  return {
    fazendaId: f.fazendaId,
    fazendaNome: f.fazendaNome,
    totalPago: f.totalPago,
    totalPendente: f.totalPendente,
    totalGasto: f.totalGasto,
    totalLucros: f.totalLucros,
    saldo: f.saldo,
    estoqueItens: itens.map((i) => ({
      cultura: i.nome,
      sacas: i.emEstoque,
      cor: i.cor,
    })),
    cotacaoDolar: cotacaoValor,
  };
}

async function montarFazendasCarousel(dadosBrutos) {
  if (!dadosBrutos.fazendas?.length) return [];

  return Promise.all(
    dadosBrutos.fazendas.map(async (f) => {
      const fazendaDestaque = await montarFazendaDestaquePorId(dadosBrutos, f.fazendaId);
      const ctx = { ...dadosBrutos, fazendaDestaque };

      return {
        fazendaId: f.fazendaId,
        fazendaNome: f.fazendaNome,
        totalPago: f.totalPago,
        totalPendente: f.totalPendente,
        estoqueItens: fazendaDestaque.estoqueItens,
        recomendacao: recomendacaoFallback("FAZENDA_FIXA", ctx),
        texto: textoFallback("FAZENDA_FIXA", ctx),
        origem: "dados",
      };
    }),
  );
}

function destaqueAnalisePorFazenda(fazenda, fazendas) {
  if (!fazendas?.length) {
    return { destaque: "Sem dados para análise.", tipo: "neutro" };
  }
  if (fazendas.length === 1) {
    return {
      destaque: `Saldo do período: ${fazenda.saldo >= 0 ? "positivo" : "negativo"} no consolidado.`,
      tipo: fazenda.saldo >= 0 ? "positivo" : "negativo",
    };
  }

  const maxPendente = Math.max(...fazendas.map((x) => x.totalPendente));
  const melhorSaldo = [...fazendas].sort((a, b) => b.saldo - a.saldo)[0];

  if (fazenda.totalPendente === maxPendente && maxPendente > 0) {
    return {
      destaque: "Maior volume de pendências financeiras entre as fazendas do escopo.",
      tipo: "negativo",
    };
  }
  if (fazenda.fazendaId === melhorSaldo?.fazendaId) {
    return {
      destaque: "Melhor custo-benefício do período (lucros vs. gastos).",
      tipo: "positivo",
    };
  }

  return {
    destaque: `Saldo R$ ${fazenda.saldo.toLocaleString("pt-BR")} · Pendente R$ ${fazenda.totalPendente.toLocaleString("pt-BR")} no período.`,
    tipo: fazenda.saldo >= 0 ? "positivo" : "negativo",
  };
}

function recomendacaoAnalisePorFazenda(fazenda, dadosBrutos) {
  const fazendas = dadosBrutos.fazendas ?? [];
  if (fazendas.length < 2) {
    return recomendacaoFallback("ANALISE_FAZENDAS", dadosBrutos);
  }

  const piorPendente = [...fazendas].sort((a, b) => b.totalPendente - a.totalPendente)[0];
  const melhorSaldo = [...fazendas].sort((a, b) => b.saldo - a.saldo)[0];

  if (fazenda.fazendaId === piorPendente?.fazendaId && fazenda.totalPendente > 0) {
    return `A ${fazenda.fazendaNome} concentra as maiores pendências (R$ ${fazenda.totalPendente.toLocaleString("pt-BR")}). Priorize quitação ou reorganização dos gastos nesta propriedade.`;
  }
  if (fazenda.fazendaId === melhorSaldo?.fazendaId) {
    return `A ${fazenda.fazendaNome} apresenta o melhor saldo do período. Considere reforçar investimentos nesta fazenda em detrimento de propriedades com pendências elevadas.`;
  }

  return `Na ${fazenda.fazendaNome}, monitore o equilíbrio entre lucros (R$ ${fazenda.totalLucros.toLocaleString("pt-BR")}) e pendências (R$ ${fazenda.totalPendente.toLocaleString("pt-BR")}) em relação às demais fazendas.`;
}

function montarAnalisePorFazenda(dadosBrutos) {
  if (!dadosBrutos.fazendas?.length) return [];

  return dadosBrutos.fazendas.map((f) => {
    const { destaque, tipo } = destaqueAnalisePorFazenda(f, dadosBrutos.fazendas);
    return {
      fazendaId: f.fazendaId,
      fazendaNome: f.fazendaNome,
      destaque,
      tipo,
      recomendacao: recomendacaoAnalisePorFazenda(f, dadosBrutos),
      totalPago: f.totalPago,
      totalPendente: f.totalPendente,
      totalLucros: f.totalLucros,
      saldo: f.saldo,
      origem: "dados",
    };
  });
}

function mesclarCarouselComSnapshotGemini(fazendasCarousel, fazendaFixaCard) {
  if (!fazendasCarousel?.length) return [];

  const idDestaque = fazendaFixaCard?.dados?.fazenda?.fazendaId;
  const temGemini = fazendaFixaCard?.origem === "gemini" && fazendaFixaCard?.recomendacao;

  return fazendasCarousel.map((item) => {
    if (temGemini && item.fazendaId === idDestaque) {
      return {
        ...item,
        recomendacao: fazendaFixaCard.recomendacao,
        texto: fazendaFixaCard.texto ?? item.texto,
        origem: fazendaFixaCard.origem,
      };
    }
    return item;
  });
}

function snapshotParaCard(snapshot) {
  if (!snapshot) return null;
  const conteudo = snapshot.conteudo ?? {};
  return {
    tipo: snapshot.tipo,
    titulo: conteudo.titulo,
    texto: conteudo.texto,
    recomendacao: conteudo.recomendacao ?? null,
    dados: conteudo.dados ?? {},
    escopo: conteudo.escopo,
    escopoLabel: conteudo.escopoLabel,
    insuficiente: Boolean(conteudo.insuficiente),
    origem: conteudo.origem ?? "cache",
    geradoEm: snapshot.gerado_em,
    atualizavel: TIPOS_REFRESHAVEIS.includes(snapshot.tipo),
  };
}

export function insightEstaDesatualizado(geradoEm) {
  if (!geradoEm) return true;
  return Date.now() - new Date(geradoEm).getTime() >= INTERVALO_AUTO_MS;
}

async function persistirInsight({ tipo, escopoCtx, conteudo, usuarioId }) {
  const row = await insightsRepository.salvarSnapshot({
    tipo,
    escopo: escopoCtx.escopo,
    fazendaId: escopoCtx.fazendaId,
    conteudo,
    geradoPor: usuarioId,
  });
  return snapshotParaCard(row);
}

async function obterRecomendacaoDashboard({ usuario, fazendaId: fazendaIdParam }) {
  const escopoCtx = await resolverEscopo(usuario, fazendaIdParam);
  const dadosBrutos = await montarDadosBrutos({ ...escopoCtx, usuario });

  const snapshots = await insightsRepository.buscarUltimosPorEscopo({
    escopo: escopoCtx.escopo,
    fazendaId: escopoCtx.fazendaId,
  });
  const mapaSnap = Object.fromEntries(snapshots.map((s) => [s.tipo, s]));

  let texto = null;
  let origem = "dados";

  if (escopoCtx.escopo === "TODAS") {
    const snapAnalise = mapaSnap.ANALISE_FAZENDAS;
    texto =
      snapAnalise?.conteudo?.recomendacao ??
      recomendacaoFallback("ANALISE_FAZENDAS", dadosBrutos);
    origem = snapAnalise?.conteudo?.origem ?? origem;

    if (!texto && dadosBrutos.fazendas?.length < 2) {
      texto = textoFallback("ANALISE_FAZENDAS", dadosBrutos);
    }
    if (!texto) {
      const snapDica = mapaSnap.DICA_DIA;
      texto = snapDica?.conteudo?.texto ?? textoFallback("DICA_DIA", dadosBrutos);
      origem = snapDica?.conteudo?.origem ?? origem;
    }
  } else {
    const snapFixa = mapaSnap.FAZENDA_FIXA;
    const fazendaDestaque = await montarFazendaDestaquePorId(dadosBrutos, escopoCtx.fazendaId);
    const ctx = { ...dadosBrutos, fazendaDestaque };
    texto = snapFixa?.conteudo?.recomendacao ?? recomendacaoFallback("FAZENDA_FIXA", ctx);
    origem = snapFixa?.conteudo?.origem ?? origem;

    if (!texto) {
      const analise = montarAnalisePorFazenda(dadosBrutos).find(
        (a) => a.fazendaId === escopoCtx.fazendaId,
      );
      texto = analise?.recomendacao ?? textoFallback("FAZENDA_FIXA", ctx);
    }
  }

  if (!texto) {
    const tipoFallback = escopoCtx.escopo === "TODAS" ? "ANALISE_FAZENDAS" : "FAZENDA_FIXA";
    const ctxFallback =
      tipoFallback === "FAZENDA_FIXA"
        ? {
            ...dadosBrutos,
            fazendaDestaque: await montarFazendaDestaquePorId(dadosBrutos, escopoCtx.fazendaId),
          }
        : dadosBrutos;
    texto = textoFallback(tipoFallback, ctxFallback);
  }

  return {
    texto: texto?.trim() || "Sem recomendações no momento.",
    origem,
    escopoLabel: escopoCtx.escopoLabel,
  };
}

export const insightsService = {
  obterRecomendacaoDashboard,

  buscarInsights: async ({ usuario, fazendaId: fazendaIdParam }) => {
    assertAdmin(usuario);
    const escopoCtx = await resolverEscopo(usuario, fazendaIdParam);
    const dadosBrutos = await montarDadosBrutos({ ...escopoCtx, usuario });

    const snapshots = await insightsRepository.buscarUltimosPorEscopo({
      escopo: escopoCtx.escopo,
      fazendaId: escopoCtx.fazendaId,
    });

    const mapaSnap = Object.fromEntries(snapshots.map((s) => [s.tipo, s]));
    const tipos = ["SAUDACAO", "ESTOQUE", "LUCROS", "ANALISE_FAZENDAS", "FAZENDA_FIXA", "DICA_DIA"];

    const cards = [];

    for (const tipo of tipos) {
      let snap = mapaSnap[tipo];

      if (!snap) {
        const conteudo = await gerarConteudoInsight({
          tipo,
          dados: dadosBrutos,
          forcarGemini: false,
        });
        snap = await insightsRepository.salvarSnapshot({
          tipo,
          escopo: escopoCtx.escopo,
          fazendaId: escopoCtx.fazendaId,
          conteudo,
          geradoPor: usuario.id,
        });
      }

      cards.push(snapshotParaCard(snap));
    }

    const mesclarDadosAoVivo = (card) => {
      if (!card) return card;
      const dadosAtualizados = dadosPorTipo(card.tipo, dadosBrutos);
      if (!dadosAtualizados || Object.keys(dadosAtualizados).length === 0) return card;
      return { ...card, dados: { ...card.dados, ...dadosAtualizados } };
    };

    const cardsAoVivo = cards.map(mesclarDadosAoVivo);
    const fazendaFixaCard = cardsAoVivo.find((c) => c?.tipo === "FAZENDA_FIXA") ?? null;
    const fazendasCarousel = mesclarCarouselComSnapshotGemini(
      await montarFazendasCarousel(dadosBrutos),
      fazendaFixaCard,
    );
    const analisePorFazenda = montarAnalisePorFazenda(dadosBrutos);

    return {
      escopo: escopoCtx.escopo,
      escopoLabel: escopoCtx.escopoLabel,
      fazendaId: fazendaIdParam === "todas" ? "todas" : escopoCtx.fazendaId,
      geminiDisponivel: geminiInsightsDisponivel(),
      intervaloAutoMinutos: 60,
      fazendasCarousel,
      analisePorFazenda,
      saudacao: cardsAoVivo.find((c) => c?.tipo === "SAUDACAO") ?? null,
      estoque: cardsAoVivo.find((c) => c?.tipo === "ESTOQUE") ?? null,
      lucros: cardsAoVivo.find((c) => c?.tipo === "LUCROS") ?? null,
      analiseFazendas: cardsAoVivo.find((c) => c?.tipo === "ANALISE_FAZENDAS") ?? null,
      fazendaFixa: fazendaFixaCard,
      dicaDia: cardsAoVivo.find((c) => c?.tipo === "DICA_DIA") ?? null,
    };
  },

  refreshInsight: async ({ usuario, tipo, fazendaId: fazendaIdParam, fazendaCarouselId }) => {
    assertAdmin(usuario);
    const escopoCtx = await resolverEscopo(usuario, fazendaIdParam);
    let dadosBrutos = await montarDadosBrutos({ ...escopoCtx, usuario });

    if (tipo === "FAZENDA_FIXA" && fazendaCarouselId) {
      dadosBrutos = {
        ...dadosBrutos,
        fazendaDestaque: await montarFazendaDestaquePorId(dadosBrutos, fazendaCarouselId),
      };
    }

    const tipos = [tipo];

    const resultados = [];
    for (const t of tipos) {
      const conteudo = await gerarConteudoInsight({
        tipo: t,
        dados: dadosBrutos,
        forcarGemini: true,
      });

      let card;
      if (t === "FAZENDA_FIXA" && fazendaCarouselId) {
        card = {
          tipo: t,
          titulo: conteudo.titulo,
          texto: conteudo.texto,
          recomendacao: conteudo.recomendacao,
          dados: conteudo.dados,
          escopo: conteudo.escopo,
          escopoLabel: conteudo.escopoLabel,
          insuficiente: conteudo.insuficiente,
          origem: conteudo.origem,
          fazendaCarouselId,
          geradoEm: new Date().toISOString(),
          atualizavel: false,
        };
      } else {
        card = await persistirInsight({
          tipo: t,
          escopoCtx,
          conteudo,
          usuarioId: usuario.id,
        });
      }

      resultados.push(card);
    }

    return { atualizados: resultados };
  },
};
