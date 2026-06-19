import { prisma } from "../database/client.js";

const TIPOS_APENAS_ADMIN = ["INSUMO_NOVO", "ARRENDAMENTO_RECEBER", "GASTO_ATRASADO"];
const TIPOS_SEM_MARCAR_EM_MASSA = ["ARRENDAMENTO_RECEBER"];

function whereParaUsuario({ usuarioId, role }) {
  return {
    usuario_id: usuarioId,
    ...(role !== "ADMIN" ? { tipo: { notIn: TIPOS_APENAS_ADMIN } } : {}),
  };
}

function listarPorUsuario({ usuarioId, role, limit }) {
  return prisma.notificacoes.findMany({
    where: whereParaUsuario({ usuarioId, role }),
    orderBy: { criado_em: "desc" },
    take: limit,
  });
}

function contarNaoLidas({ usuarioId, role }) {
  return prisma.notificacoes.count({
    where: {
      ...whereParaUsuario({ usuarioId, role }),
      lida_em: null,
    },
  });
}

function contarNaoLidasMarcaveis({ usuarioId, role }) {
  return prisma.notificacoes.count({
    where: {
      ...whereParaUsuario({ usuarioId, role }),
      lida_em: null,
      tipo: { notIn: TIPOS_SEM_MARCAR_EM_MASSA },
    },
  });
}

function marcarComoLida({ usuarioId, id }) {
  return prisma.notificacoes.updateMany({
    where: {
      id,
      usuario_id: usuarioId,
      lida_em: null,
    },
    data: {
      lida_em: new Date(),
      atualizado_em: new Date(),
    },
  });
}

function marcarTodasComoLidas({ usuarioId }) {
  return marcarTodasComoLidasExcetoTipos({ usuarioId, tiposExcluidos: [] });
}

function marcarTodasComoLidasExcetoTipos({ usuarioId, tiposExcluidos = [] }) {
  return prisma.notificacoes.updateMany({
    where: {
      usuario_id: usuarioId,
      lida_em: null,
      ...(tiposExcluidos.length ? { tipo: { notIn: tiposExcluidos } } : {}),
    },
    data: {
      lida_em: new Date(),
      atualizado_em: new Date(),
    },
  });
}

function criarMuitas(notificacoes) {
  if (!Array.isArray(notificacoes) || notificacoes.length === 0) {
    return Promise.resolve({ count: 0 });
  }

  return prisma.notificacoes.createMany({
    data: notificacoes,
    skipDuplicates: true,
  });
}

export const notificacaoRepository = {
  listarPorUsuario,
  contarNaoLidas,
  contarNaoLidasMarcaveis,
  marcarComoLida,
  marcarTodasComoLidas,
  marcarTodasComoLidasExcetoTipos,
  criarMuitas,
};
