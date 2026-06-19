import { randomUUID } from "node:crypto";
import { AppError } from "../shared/errors/AppError.js";
import { assertFazendaOperavelPorId } from "../shared/fazenda/fazendaOperacao.js";
import { lembreteRepository } from "../repositories/lembrete.repository.js";
import { whatsappService } from "./whatsapp.service.js";
import { notificacaoService } from "./notificacao.service.js";
import { prisma } from "../database/client.js";
import {
  calcularStatus,
  chaveDiaLocal,
  fimDoDiaLocal,
  inicioDoDiaLocal,
  inicioDoProximoDiaLocal,
} from "../utils/lembrete.utils.js";
import {
  expandirLembretesNoIntervalo,
  mesmaOcorrencia,
  montarWhereLembretes,
  temRecorrencia,
} from "../utils/lembrete.recorrencia.js";
import { lembreteVinculosInclude } from "../shared/lembrete/lembreteIncludes.js";
const statusPermitidos = new Set(["PENDENTE", "ENVIADO", "CANCELADO"]);

function validarStatus(status) {
  if (!status) return;
  if (!statusPermitidos.has(status)) {
    throw new AppError("Status de lembrete invalido", 400);
  }
}

function mapearPayload(payload, { parcial = false } = {}) {
  validarStatus(payload.status);

  const recorrencia = parcial ? payload.recorrencia : (payload.recorrencia ?? "NENHUMA");
  const recorrenciaCustom = recorrencia === "OUTROS"
    ? (payload.recorrenciaCustom ?? null)
    : (recorrencia ? null : undefined);

  return {
    usuario_id: payload.usuarioId,
    titulo: payload.titulo,
    descricao: payload.descricao,
    data_lembrete: payload.dataLembrete,
    telefone_whatsapp: payload.telefoneWhatsapp,
    recorrencia,
    recorrencia_custom: recorrenciaCustom,
    status: payload.status,
  };
}

function limparUndefined(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  );
}

async function resolverVinculosLembrete({
  fazendaId,
  colheitaId,
  poligonoId,
  lembreteAtual,
} = {}) {
  let fazenda =
    fazendaId !== undefined ? (fazendaId || null) : (lembreteAtual?.fazenda_id ?? null);
  let colheita =
    colheitaId !== undefined ? (colheitaId || null) : (lembreteAtual?.colheita_id ?? null);
  let poligono =
    poligonoId !== undefined ? (poligonoId || null) : (lembreteAtual?.poligono_id ?? null);

  if (colheita) {
    const row = await prisma.colheitas.findUnique({
      where: { id: colheita },
      select: { fazenda_id: true },
    });
    if (!row) {
      throw new AppError("Colheita nao encontrada", 404);
    }
    if (fazenda && fazenda !== row.fazenda_id) {
      throw new AppError("Colheita nao pertence a fazenda selecionada", 400);
    }
    fazenda = row.fazenda_id;
  }

  if (poligono) {
    const row = await prisma.poligonos_fazenda.findUnique({
      where: { id: poligono },
      select: { fazenda_id: true },
    });
    if (!row) {
      throw new AppError("Talhao nao encontrado", 404);
    }
    if (fazenda && fazenda !== row.fazenda_id) {
      throw new AppError("Talhao nao pertence a fazenda selecionada", 400);
    }
    fazenda = fazenda ?? row.fazenda_id;
  }

  return {
    fazenda_id: fazenda,
    colheita_id: colheita,
    poligono_id: poligono,
  };
}

function montarMensagem(lembrete, dataOcorrencia) {
  const dataFormatada = new Date(dataOcorrencia ?? lembrete.data_lembrete).toLocaleString(
    "pt-BR",
  );
  const descricao = lembrete.descricao
    ? `\nDetalhes: ${lembrete.descricao}`
    : "";

  return `Agrofarm - Lembrete\n${lembrete.titulo}\nData: ${dataFormatada}${descricao}`;
}

function resolverTelefone(lembrete) {
  return lembrete.telefone_whatsapp || lembrete.usuarios?.telefone || null;
}

async function listarTodos({ usuario, fazendaId, status, data }) {
  const fazendasFiltradas = normalizarFiltroFazenda({
    fazendaId,
    role: usuario.role,
    fazendaIdsPermitidas: usuario.fazendaIds,
  });

  let lembretes = await lembreteRepository.buscarTodosComFiltros({
    fazendaIdsPermitidas: fazendasFiltradas,
    status,
    data,
  });

  const inicio = data ? inicioDoDiaLocal(data) : new Date(0);
  const fim = data ? inicioDoProximoDiaLocal(data) : new Date();

  const whereGastos = {
    data_vencimento: {
      gte: inicio,
      lte: fim,
    },
  };

  if (fazendasFiltradas !== null) {
    whereGastos.colheitas = {
      fazenda_id: { in: fazendasFiltradas },
    };
  }

  const gastos = await prisma.gastos.findMany({
    where: whereGastos,
    include: {
      colheitas: {
        include: {
          fazendas: { select: { id: true, nome: true } },
          culturas: { select: { id: true, nome: true, cor: true } },
        },
      },
    },
  });

  const eventosGasto = gastos.map(transformarGastoEmEvento);

  let resultado = [...lembretes, ...eventosGasto].map((item) => {
    if (item.tipo === "GASTO") return item;

    const statusCalculado = calcularStatus(item);

    return {
      ...item,
      status: statusCalculado,
    };
  });

  if (status) {
    resultado = resultado.filter((item) => item.status === status);
  }

  resultado.sort(
    (a, b) => new Date(a.data_lembrete) - new Date(b.data_lembrete),
  );

  return resultado;
}

async function buscarPorId(id) {
  const lembrete = await lembreteRepository.buscarPorId(id);

  if (!lembrete) {
    throw new AppError("Lembrete nao encontrado", 404);
  }

  return lembrete;
}

async function criar(payload) {
  const { usuario } = payload;

  const vinculos = await resolverVinculosLembrete({
    fazendaId: payload.fazendaId,
    colheitaId: payload.colheitaId,
    poligonoId: payload.poligonoId,
  });

  if (
    vinculos.fazenda_id &&
    usuario.role !== "ADMIN" &&
    !usuario.fazendaIds.includes(vinculos.fazenda_id)
  ) {
    throw new AppError("Sem permissão para essa fazenda", 403);
  }

  if (vinculos.fazenda_id) {
    await assertFazendaOperavelPorId(vinculos.fazenda_id);
  }

  const data = limparUndefined({
    id: randomUUID(),
    ...mapearPayload(payload, { parcial: false }),
    ...vinculos,
    status: payload.status || "PENDENTE",
  });

  const lembrete = await lembreteRepository.criar(data);
  await notificacaoService.notificarNovoLembrete({ lembrete });

  return lembrete;
}

async function atualizar(id, payload) {
  const lembrete = await buscarPorId(id);

  const temVinculo = ["fazendaId", "colheitaId", "poligonoId"].some(
    (chave) => payload[chave] !== undefined,
  );

  const vinculos = temVinculo
    ? await resolverVinculosLembrete({
        fazendaId: payload.fazendaId,
        colheitaId: payload.colheitaId,
        poligonoId: payload.poligonoId,
        lembreteAtual: lembrete,
      })
    : {};

  const fazendaIdOperacao = vinculos.fazenda_id ?? lembrete.fazenda_id;
  if (fazendaIdOperacao) {
    await assertFazendaOperavelPorId(fazendaIdOperacao);
  }

  const data = limparUndefined({
    ...mapearPayload(payload, { parcial: true }),
    ...vinculos,
  });
  return lembreteRepository.atualizar(id, data);
}

async function remover(id) {
  const lembrete = await buscarPorId(id);
  if (lembrete.fazenda_id) {
    await assertFazendaOperavelPorId(lembrete.fazenda_id);
  }
  return lembreteRepository.remover(id);
}

async function removerTodos({ usuario }) {
  if (usuario.role !== "ADMIN") {
    throw new AppError("Apenas ADMIN pode remover todos os lembretes", 403);
  }

  const resultado = await lembreteRepository.removerTodos();

  return {
    mensagem: "Todos os lembretes foram removidos",
    totalRemovidos: resultado.count,
  };
}

async function enviarLembrete(id, { dataOcorrencia } = {}) {
  const lembrete = await buscarPorId(id);

  if (lembrete.status === "CANCELADO") {
    throw new AppError("Nao e possivel enviar lembrete cancelado", 400);
  }

  const telefone = resolverTelefone(lembrete);

  if (!telefone) {
    throw new AppError(
      "Lembrete sem telefone para envio. Informe telefoneWhatsapp ou telefone do usuario.",
      400,
    );
  }

  const dataEnvio = dataOcorrencia ?? lembrete.data_lembrete;

  try {
    await whatsappService.enviarTexto({
      numero: telefone,
      texto: montarMensagem(lembrete, dataEnvio),
    });
  } catch (erro) {
    const mensagem = String(erro?.message ?? erro).slice(0, 500);
    await lembreteRepository.atualizar(id, { erro_envio: mensagem }).catch(() => {});
    throw erro;
  }

  if (temRecorrencia(lembrete.recorrencia)) {
    return lembreteRepository.atualizar(id, { enviado_em: dataEnvio, erro_envio: null });
  }

  if (lembrete.status !== "ENVIADO") {
    return lembreteRepository.atualizar(id, {
      status: "ENVIADO",
      enviado_em: dataEnvio,
      erro_envio: null,
    });
  }

  return lembrete;
}

async function processarPendentes(dataReferencia = new Date()) {
  const janelaInicio = new Date(dataReferencia.getTime() - 5 * 60 * 1000);
  const janelaFim = dataReferencia;

  const candidatos = await prisma.lembretes.findMany({
    where: {
      AND: [
        montarWhereLembretes({
          inicio: janelaInicio,
          fim: janelaFim,
          fazendasFiltradas: null,
          filtroEspecificoFazenda: false,
        }).AND,
        { status: "PENDENTE" },
      ],
    },
    include: {
      usuarios: true,
    },
    orderBy: { data_lembrete: "asc" },
  });

  const pendentes = expandirLembretesNoIntervalo(candidatos, janelaInicio, janelaFim)
    .filter((lembrete) => {
      if (!lembrete.enviado_em) return true;
      return !mesmaOcorrencia(lembrete.enviado_em, lembrete.data_lembrete);
    });

  let enviados = 0;
  let falhas = 0;

  for (const lembrete of pendentes) {
    try {
      await enviarLembrete(lembrete.id, { dataOcorrencia: lembrete.data_lembrete });
      enviados += 1;
    } catch {
      falhas += 1;
    }
  }

  return {
    total: pendentes.length,
    enviados,
    falhas,
  };
}

async function getCalendario({ mes, ano, fazendaId, status, usuario }) {
  if (!usuario) {
    throw new AppError("Usuário não autenticado", 401);
  }
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  const fazendasFiltradas = normalizarFiltroFazenda({
    fazendaId,
    role: usuario.role,
    fazendaIdsPermitidas: usuario.fazendaIds,
  });

  const filtroEspecificoFazenda = Boolean(fazendaId && fazendaId !== "all");

  const lembretes = await prisma.lembretes.findMany({
    where: montarWhereLembretes({
      inicio,
      fim,
      fazendasFiltradas,
      filtroEspecificoFazenda,
    }),
  });

  const lembretesExpandidos = expandirLembretesNoIntervalo(lembretes, inicio, fim);

  const whereGastos = {
    data_vencimento: {
      gte: inicio,
      lte: fim,
    },
  };

  if (fazendasFiltradas !== null) {
    whereGastos.colheitas = {
      fazenda_id: { in: fazendasFiltradas },
    };
  }

  const gastos = await prisma.gastos.findMany({
    where: whereGastos,
    include: {
      colheitas: {
        include: {
          fazendas: { select: { id: true, nome: true } },
          culturas: { select: { id: true, nome: true, cor: true } },
        },
      },
    },
  });

  const resultado = {};

  for (const l of lembretesExpandidos) {
    const dia = chaveDiaLocal(l.data_lembrete);
    const statusCalculado = l.status;

    if (status && statusCalculado !== status) continue;

    if (!resultado[dia]) {
      resultado[dia] = { ATRASADO: 0, PENDENTE: 0, ENVIADO: 0 };
    }

    if (!Object.hasOwn(resultado[dia], statusCalculado)) continue;
    resultado[dia][statusCalculado]++;
  }

  for (const g of gastos) {
    const evento = transformarGastoEmEvento(g);
    if (status && evento.status !== status) continue;
    const dia = chaveDiaLocal(evento.data_lembrete);

    if (!resultado[dia]) {
      resultado[dia] = { ATRASADO: 0, PENDENTE: 0, ENVIADO: 0 };
    }

    resultado[dia][evento.status]++;
  }

  return resultado;
}

async function getDia({ data, status, fazendaId, usuario }) {
  const inicio = inicioDoDiaLocal(data);
  const fim = inicioDoProximoDiaLocal(data);
  const fimDia = fimDoDiaLocal(data);

  const fazendasFiltradas = normalizarFiltroFazenda({
    fazendaId,
    role: usuario.role,
    fazendaIdsPermitidas: usuario.fazendaIds,
  });

  const filtroEspecificoFazenda = Boolean(fazendaId && fazendaId !== "all");

  const lembretesBase = await prisma.lembretes.findMany({
    where: montarWhereLembretes({
      inicio,
      fim: fimDia,
      fazendasFiltradas,
      filtroEspecificoFazenda,
    }),
    include: lembreteVinculosInclude,
    orderBy: { data_lembrete: "asc" },
  });

  let lembretes = expandirLembretesNoIntervalo(lembretesBase, inicio, fimDia);

  const whereGastos = {
    data_vencimento: {
      gte: inicio,
      lt: fim,
    },
  };

  if (fazendasFiltradas !== null) {
    whereGastos.colheitas = {
      fazenda_id: { in: fazendasFiltradas },
    };
  }

  const gastos = await prisma.gastos.findMany({
    where: whereGastos,
    include: {
      colheitas: {
        include: {
          fazendas: { select: { id: true, nome: true } },
          culturas: { select: { id: true, nome: true, cor: true } },
        },
      },
    },
  });

  const eventosGasto = gastos.map(transformarGastoEmEvento);

  let resultadoFinal = [...lembretes, ...eventosGasto];

  if (status) {
    resultadoFinal = resultadoFinal.filter((item) => {
      if (item.tipo === "GASTO") return item.status === status;
      return item.status === status;
    });
  }

  return resultadoFinal;
}

async function updateStatus(id, status) {
  validarStatus(status);
  await buscarPorId(id);
  return lembreteRepository.atualizar(id, { status });
}

function transformarGastoEmEvento(gasto) {
  const fazenda = gasto.colheitas?.fazendas;
  const cultura = gasto.colheitas?.culturas;

  const base = {
    data_lembrete: gasto.data_vencimento,
    status: gasto.status === "PAGO" ? "ENVIADO" : "PENDENTE",
  };

  const statusCalculado = calcularStatus(base);

  return {
    id: `gasto-${gasto.id}`,
    titulo: gasto.descricao?.trim() ? `Gasto: ${gasto.descricao.trim()}` : "Vencimento de gasto",
    descricao: "Vencimento de gasto",
    data_lembrete: gasto.data_vencimento,
    status: statusCalculado,
    tipo: "GASTO",
    valor: Number(gasto.valor),
    colheita: {
      id: gasto.colheita_id,
      ano: gasto.colheitas?.ano,
    },
    fazenda_id: fazenda?.id ?? null,
    fazenda: fazenda ? { id: fazenda.id, nome: fazenda.nome } : null,
    cultura: cultura ? { id: cultura.id, nome: cultura.nome, cor: cultura.cor } : null,
  };
}

function normalizarFiltroFazenda({ fazendaId, role, fazendaIdsPermitidas }) {
  if (role === "ADMIN") {
    if (!fazendaId || fazendaId === "all") {
      return null;
    }

    return [fazendaId];
  }

  if (!fazendaIdsPermitidas || fazendaIdsPermitidas.length === 0) {
    return [];
  }

  if (fazendaId) {
    if (!fazendaIdsPermitidas.includes(fazendaId)) {
      return [];
    }

    return [fazendaId];
  }

  return fazendaIdsPermitidas;
}
export const lembreteService = {
  listarTodos,
  buscarPorId,
  criar,
  atualizar,
  remover,
  enviarLembrete,
  processarPendentes,
  getCalendario,
  getDia,
  updateStatus,
  transformarGastoEmEvento,
  normalizarFiltroFazenda,
  removerTodos,
};
