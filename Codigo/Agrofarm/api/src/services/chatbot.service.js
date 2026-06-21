import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../shared/errors/AppError.js";
import {
  resolverChaveGeminiChatbot,
  validarFormatoChaveGemini,
} from "../shared/gemini/geminiKey.js";
import { logger } from "../shared/utils/logger.js";
import { chatbotRepository } from "../repositories/chatbot.repository.js";
import { chatbotView } from "../views/chatbot.view.js";
import { montarContextoCompleto } from "./chatbot.context.js";
import { compactarContextoParaGemini } from "./chatbot.geminiContext.js";
import { INSTRUCAO_SISTEMA_CHATBOT } from "./chatbot.instructions.js";
import {
  listarCatalogoConsultasFactuais,
  normalizarPergunta,
  perguntaAnaliticaOuOpiniao,
  perguntaExigeAnaliseCompleta,
  resolverFazendaNaPergunta,
  tentarRespostaConsultaRapida,
} from "./chatbot.consultasRapidas.js";

export {
  INSTRUCAO_SISTEMA_CHATBOT,
  perguntaAnaliticaOuOpiniao,
  perguntaExigeAnaliseCompleta,
  listarCatalogoConsultasFactuais,
};

/** Ordem: mais novo primeiro; compatível com contas/regiões variadas. */
/** Modelos testados na API Google (maio/2026). Prioriza os que respondem na conta free. */
const MODELOS_GEMINI = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

const GEMINI_GENERATION_CONFIG = {
  temperature: 0.35,
  topP: 0.88,
  maxOutputTokens: 2048,
};
const PAPEL_USUARIO = "usuario";
const PAPEL_ASSISTENTE = "assistente";

function formatarMoedaBR(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarDataBR(valor) {
  if (!valor) return "—";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function erroGeminiEhChaveInvalida(err) {
  const msg = String(err?.message ?? err);
  return msg.includes("API_KEY_INVALID") || msg.includes("API key not valid");
}

/**
 * Resposta determinística só com dados do banco — funciona sem API de IA.
 */
function construirRespostaSomenteDados(ctx, perguntaUsuario, aviso) {
  const consultaRapida = tentarRespostaConsultaRapida(ctx, perguntaUsuario);
  if (consultaRapida) return consultaRapida;

  const q = normalizarPergunta(perguntaUsuario);

  if (perguntaExigeAnaliseCompleta(q)) {
    const g = ctx.resumoGeral ?? {};
    return [
      "**Análise indisponível sem o modelo de IA**",
      "",
      aviso,
      "",
      "Enquanto isso, um resumo rápido dos seus dados:",
      `• Fazendas visíveis: ${ctx.fazendas?.length ?? 0}`,
      `• Saldo aproximado: ${formatarMoedaBR(g.saldoAproximado ?? ctx.saldoAproximado)}`,
      `• Lucros: ${formatarMoedaBR(g.totalLucros ?? ctx.totalLucros)} · Gastos: ${formatarMoedaBR(g.totalGastos ?? ctx.totalGastos)}`,
      "",
      "Reformule perguntas objetivas como: “qual meu saldo?”, “o que tenho no estoque?” ou “gastos pendentes”.",
    ].join("\n");
  }

  if (/\b(como|onde|cadastr|registrar|passo|tutorial|usar o|funciona)\b/.test(q) && /\b(fazenda|colheita|gasto|lucro|insumo|lembrete|estoque|sistema|agrofarm)\b/.test(q)) {
    const modulos = (ctx.modulosAgroFarm ?? [])
      .map((m) => `• **${m.modulo}** (${m.rota}): ${m.paraQueServe}`)
      .join("\n");
    return [
      "**Como usar o AgroFarm**",
      "",
      aviso,
      "",
      "Módulos principais:",
      modulos || "— Consulte o menu lateral do sistema.",
      "",
      "Para um passo a passo detalhado, configure a chave Gemini e pergunte novamente — o assistente explica o fluxo completo.",
    ].join("\n");
  }

  const linhas = [];
  const totalLucros = ctx.resumoGeral?.totalLucros ?? ctx.totalLucros ?? 0;
  const totalGastos = ctx.resumoGeral?.totalGastos ?? ctx.totalGastos ?? 0;
  const saldoAproximado = ctx.resumoGeral?.saldoAproximado ?? ctx.saldoAproximado ?? 0;
  const colheitasTotal = ctx.resumoGeral?.colheitasTotal ?? ctx.colheitasTotal;
  const producaoPorCultura = ctx.producaoPorCulturaAgregada ?? ctx.producaoPorCultura ?? [];
  const estoqueResumo = ctx.estoqueResumoAgregado ?? ctx.estoqueResumo ?? [];
  const cambioUSD = ctx.mercado?.dolar ?? ctx.cambioUSD;
  const ultimasMovimentacoes =
    ctx.ultimasMovimentacoesFinanceiras ?? ctx.ultimasMovimentacoes ?? [];

  linhas.push("Resumo dos seus dados no AgroFarm\n");

  if (!ctx.fazendas?.length) {
    linhas.push("• Fazendas: nenhuma fazenda visível para seu usuário. Administradores veem todas; funcionários precisam de vínculo.");
  } else {
    linhas.push(
      `• Fazendas (${ctx.fazendas.length}): ${ctx.fazendas.map((f) => f.nome).join(", ")}`,
    );
  }

  if (colheitasTotal != null) {
    linhas.push(`• Registros de colheita: ${colheitasTotal}`);
  }

  const destacaFinanceiro = /\b(lucro|gastos?|financeiro|extrato|saldo|receita|despesa|pago|pendente)\b/.test(q);
  const destacaCultura = /\b(cultura|producao|produção|saca|colheita|area|hectare|estoque|produtivid)\b/.test(q);
  const destacaLembrete = /\b(lembrete|lembretes|agenda|pendente)\b/.test(q);
  const destacaInsumo = /\b(insumo|insumos|adubo|defensivo)\b/.test(q);
  const destacaCambio = /\b(dolar|dólar|cambio|câmbio|usd)\b/.test(q);

  const blocoFinanceiro = () => {
    const out = [];
    out.push("\nFinanceiro (escopo das fazendas visíveis)");
    out.push(`• Total bruto de lucros (vendas registradas): ${formatarMoedaBR(totalLucros)}`);
    out.push(`• Total de gastos registrados: ${formatarMoedaBR(totalGastos)}`);
    out.push(`• Saldo aproximado (lucros − gastos): ${formatarMoedaBR(saldoAproximado)}`);
    if (cambioUSD?.valor != null) {
      out.push(`• Dólar (referência): ${formatarMoedaBR(cambioUSD.valor)}`);
    }
    out.push("\nÚltimas movimentações (mescladas)");
    if (!ultimasMovimentacoes.length) {
      out.push("— Nenhuma movimentação recente nos dados retornados.");
    } else {
      for (const m of ultimasMovimentacoes) {
        const sinal = m.tipo === "LUCRO" ? "+" : "−";
        out.push(
          `• ${formatarDataBR(m.data)} — ${m.tipo} ${sinal} ${formatarMoedaBR(Math.abs(m.valor))} — ${m.descricao}`,
        );
      }
    }
    return out;
  };

  const blocoCulturas = () => {
    const out = [];
    out.push("\nProdução agregada por cultura");
    if (!producaoPorCultura.length) {
      out.push("— Sem colheitas registradas neste escopo.", "");
      out.push("Estoque (sacas por cultura, derivado de colheitas)");
      out.push("— Sem dados.");
      return out;
    }
    for (const p of producaoPorCultura) {
      out.push(
        `• ${p.nome}: ${Number(p.sacas).toLocaleString("pt-BR")} sacas · ${Number(p.area).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha · produt. ~${Number(p.produtividade).toFixed(2)} sacas/ha`,
      );
    }
    out.push("\nEstoque / última colheita por cultura");
    for (const e of estoqueResumo) {
      out.push(
        `• ${e.nome}: ${Number(e.peso).toLocaleString("pt-BR")} sacas (última colheita ${formatarDataBR(e.dataColheita)})`,
      );
    }
    return out;
  };

  const blocoLembretes = () => {
    const out = [];
    out.push("\nLembretes recentes (seus)");
    if (!ctx.lembretesRecentes?.length) {
      out.push("— Nenhum lembrete retornado.");
      return out;
    }
    for (const l of ctx.lembretesRecentes) {
      out.push(`• ${formatarDataBR(l.data ?? l.data_lembrete)} — ${l.status} — ${l.titulo}`);
    }
    return out;
  };

  const blocoInsumos = () => {
    const out = [];
    out.push("\nÚltimos insumos / atividades");
    if (!ctx.insumosRecentes?.length) {
      out.push("— Nenhum registro recente.");
      return out;
    }
    for (const i of ctx.insumosRecentes) {
      const total = Number(i.quantidade ?? 0) * Number(i.valor_unitario ?? 0);
      out.push(
        `• ${formatarDataBR(i.data)} — ${i.item} (${i.quantidade} ${i.unidade}) · ~${formatarMoedaBR(total)} · ${i.categoria}`,
      );
    }
    return out;
  };

  const blocoCambio = () => {
    if (!cambioUSD?.valor) return ["\nCâmbio: sem cotação no contexto."];
    return [`\nCâmbio: USD/BRL ≈ ${formatarMoedaBR(cambioUSD.valor)}`];
  };

  if (destacaFinanceiro) {
    linhas.push(...blocoFinanceiro(), ...blocoCulturas());
  } else if (destacaCultura) {
    linhas.push(...blocoCulturas(), ...blocoFinanceiro());
  } else if (destacaLembrete) {
    linhas.push(...blocoLembretes(), ...blocoFinanceiro(), ...blocoCulturas());
  } else if (destacaInsumo) {
    linhas.push(...blocoInsumos(), ...blocoCulturas(), ...blocoFinanceiro());
  } else if (destacaCambio) {
    linhas.push(...blocoCambio(), ...blocoFinanceiro(), ...blocoCulturas());
  } else {
    linhas.push(
      ...blocoFinanceiro(),
      ...blocoCulturas(),
      ...blocoLembretes(),
      ...blocoInsumos(),
    );
  }

  linhas.push(
    "\n———",
    aviso,
    "\nDica: pergunte de forma específica, por exemplo: “quanto tenho de lucro?”, “últimos gastos”, “produção por cultura”, “meus lembretes”.",
  );

  return linhas.filter(Boolean).join("\n");
}

async function montarContextoOperacional(usuario) {
  return montarContextoCompleto(usuario);
}

function montarHistoricoGemini(mensagensAsc) {
  const historico = [];
  for (let i = 0; i < mensagensAsc.length - 1; i++) {
    const m = mensagensAsc[i];
    historico.push({
      role: m.papel === PAPEL_USUARIO ? "user" : "model",
      parts: [{ text: m.conteudo }],
    });
  }
  return historico;
}

async function invocarGemini({ contextoJson, mensagensAsc }) {
  const apiKey = resolverChaveGeminiChatbot();
  if (!apiKey) {
    return { ok: false, motivo: "sem_chave" };
  }

  const formato = validarFormatoChaveGemini(apiKey);
  if (!formato.ok) {
    logger.error({ codigo: formato.codigo, tamanho: formato.tamanho }, "Chave Gemini com formato inválido no .env");
    return { ok: false, motivo: "chave_formato_invalido", detalhe: formato };
  }

  if (mensagensAsc.length === 0) {
    throw new AppError("Nao ha mensagem para processar", 400);
  }

  const ultima = mensagensAsc[mensagensAsc.length - 1];
  if (ultima.papel !== PAPEL_USUARIO) {
    throw new AppError("Ultima mensagem deve ser do usuario", 400);
  }

  const textoUsuarioContextualizado = [
    "## Contexto AgroFarm (JSON — fonte única de fatos)",
    contextoJson,
    "",
    "## Pergunta do usuário",
    ultima.conteudo,
    "",
    "Responda em português do Brasil, de forma clara e objetiva. Use apenas números presentes no JSON acima.",
  ].join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const historico = montarHistoricoGemini(mensagensAsc);

  let ultimoErro = null;
  for (const nomeModelo of MODELOS_GEMINI) {
    try {
      const model = genAI.getGenerativeModel({
        model: nomeModelo,
        systemInstruction: INSTRUCAO_SISTEMA_CHATBOT,
        generationConfig: GEMINI_GENERATION_CONFIG,
      });
      const chat = model.startChat({ history: historico });
      const result = await chat.sendMessage(textoUsuarioContextualizado);
      const texto = result.response?.text()?.trim();
      if (texto) {
        logger.debug({ modelo: nomeModelo }, "Gemini respondeu no chatbot");
        return { ok: true, texto };
      }
    } catch (err) {
      ultimoErro = err;
      if (erroGeminiEhChaveInvalida(err)) {
        logger.error({ modelo: nomeModelo }, "Chave Gemini rejeitada pelo Google (API_KEY_INVALID)");
        return { ok: false, motivo: "chave_invalida" };
      }
      const errMsg = String(err?.message ?? err);
      if (errMsg.includes("429") || errMsg.includes("Too Many Requests")) {
        logger.warn({ modelo: nomeModelo }, "Cota Gemini excedida neste modelo; tentando próximo");
        continue;
      }
      logger.warn(
        { err: String(err?.message ?? err), modelo: nomeModelo },
        "Falha ao invocar Gemini; tentando próximo modelo",
      );
    }
  }

  if (ultimoErro) {
    logger.error({ err: String(ultimoErro?.message ?? ultimoErro) }, "Gemini esgotou modelos");
  }
  return { ok: false, motivo: "modelo_indisponivel" };
}

export const chatbotService = {
  /** Resumo enxuto para o painel lateral do chatbot. */
  obterResumoDados: async (usuario) => {
    const ctx = await montarContextoOperacional(usuario);
    return chatbotView.renderResumoPainel(ctx);
  },

  listarConsultasFactuais: () => listarCatalogoConsultasFactuais(),

  listarSessoes: async (usuario, limite) => {
    const rows = await chatbotRepository.listarSessoesDoUsuario(usuario.id, limite);
    return chatbotView.renderManySessoes(rows);
  },

  listarMensagens: async (usuario, sessaoId) => {
    const sessao = await chatbotRepository.buscarSessaoDoUsuario(sessaoId, usuario.id);
    if (!sessao) {
      throw new AppError("Conversa nao encontrada", 404);
    }

    const mensagens = await chatbotRepository.listarMensagensAsc(sessaoId);
    return chatbotView.renderManyMensagens(mensagens);
  },

  renomearSessao: async (usuario, sessaoId, titulo) => {
    const tituloLimpo = String(titulo ?? "").replace(/\s+/g, " ").trim();
    if (!tituloLimpo) {
      throw new AppError("Titulo obrigatorio", 400);
    }

    const result = await chatbotRepository.atualizarTituloSessao({
      sessaoId,
      usuarioId: usuario.id,
      titulo: tituloLimpo,
    });

    if (result.count === 0) {
      throw new AppError("Conversa nao encontrada", 404);
    }

    const sessao = await chatbotRepository.buscarSessaoDoUsuario(sessaoId, usuario.id);
    return chatbotView.renderSessao(sessao);
  },

  excluirSessao: async (usuario, sessaoId) => {
    const result = await chatbotRepository.excluirSessao({
      sessaoId,
      usuarioId: usuario.id,
    });

    if (result.count === 0) {
      throw new AppError("Conversa nao encontrada", 404);
    }
  },

  enviarMensagem: async (usuario, { sessaoId, conteudo }) => {
    let sessao = null;

    if (sessaoId) {
      sessao = await chatbotRepository.buscarSessaoDoUsuario(sessaoId, usuario.id);
      if (!sessao) {
        throw new AppError("Conversa nao encontrada", 404);
      }
    } else {
      const tituloBase = conteudo.replace(/\s+/g, " ").trim().slice(0, 120);
      sessao = await chatbotRepository.criarSessao({
        usuarioId: usuario.id,
        titulo: tituloBase || null,
      });
    }

    const novaSessaoId = sessao.id;

    const msgUsuario = await chatbotRepository.criarMensagem({
      sessaoId: novaSessaoId,
      papel: PAPEL_USUARIO,
      conteudo,
    });

    const ctx = await montarContextoOperacional(usuario);
    const perguntaNorm = normalizarPergunta(conteudo);
    const fazendaAlvo = resolverFazendaNaPergunta(perguntaNorm, ctx.fazendas ?? []);
    const respostaRapidaFactuais = tentarRespostaConsultaRapida(ctx, conteudo);
    const exigeIA = perguntaExigeAnaliseCompleta(perguntaNorm);

    const contextoGemini = compactarContextoParaGemini(ctx, {
      dadosPreCalculados: exigeIA && respostaRapidaFactuais ? respostaRapidaFactuais : null,
      fazendaAlvo,
    });
    const contextoJson = JSON.stringify(contextoGemini);

    const mensagensAsc = await chatbotRepository.listarMensagensAsc(novaSessaoId);

    let textoAssistente;
    let fonteResposta = "dados";

    if (respostaRapidaFactuais && !exigeIA) {
      textoAssistente = respostaRapidaFactuais;
      fonteResposta = "consulta_rapida";
    }

    try {
      if (!textoAssistente) {
        const ia = await invocarGemini({ contextoJson, mensagensAsc });
        if (ia.ok && ia.texto) {
          textoAssistente = ia.texto;
          fonteResposta = "ia";
        } else if (ia.motivo === "sem_chave") {
          textoAssistente = construirRespostaSomenteDados(
            ctx,
            conteudo,
            "Consulta pelos dados cadastrados (modelo de IA não configurado: defina `GEMINI_API_KEY_CHATBOT` no .env da API e reinicie o servidor).",
          );
        } else if (ia.motivo === "chave_formato_invalido") {
          const tam = ia.detalhe?.tamanho;
          textoAssistente = construirRespostaSomenteDados(
            ctx,
            conteudo,
            `A chave no .env parece incorreta (${tam ? `${tam} caracteres` : "formato inválido"}; use a chave copiada de https://aistudio.google.com/apikey — costuma começar com AIza ou AQ., sem aspas, espaços ou texto extra). Reinicie a API.`,
          );
        } else if (ia.motivo === "chave_invalida") {
          textoAssistente = construirRespostaSomenteDados(
            ctx,
            conteudo,
            "A chave foi rejeitada pelo Google (inválida ou revogada). Gere outra em https://aistudio.google.com/apikey , atualize GEMINI_API_KEY_CHATBOT no .env da pasta api, reinicie o servidor e teste de novo.",
          );
        } else {
          textoAssistente = construirRespostaSomenteDados(
            ctx,
            conteudo,
            "Consulta pelos dados cadastrados (modelo de IA indisponível no momento — tente novamente mais tarde).",
          );
        }
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      logger.error({ err: String(e?.message ?? e) }, "Erro inesperado no chatbot");
      textoAssistente = construirRespostaSomenteDados(
        ctx,
        conteudo,
        "Consulta pelos dados cadastrados (erro ao contatar a IA).",
      );
    }

    const msgAssistente = await chatbotRepository.criarMensagem({
      sessaoId: novaSessaoId,
      papel: PAPEL_ASSISTENTE,
      conteudo: textoAssistente,
      metadados: { fonteResposta },
    });

    await chatbotRepository.tocarSessao(novaSessaoId);

    return {
      sessaoId: novaSessaoId,
      mensagemUsuario: chatbotView.renderMensagem(msgUsuario),
      mensagemAssistente: chatbotView.renderMensagem(msgAssistente),
      meta: { fonteResposta },
    };
  },
};
