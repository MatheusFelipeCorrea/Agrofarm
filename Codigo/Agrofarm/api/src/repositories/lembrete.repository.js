import { prisma } from "../database/client.js";
import { lembreteVinculosInclude } from "../shared/lembrete/lembreteIncludes.js";

function listarTodos() {
  return prisma.lembretes.findMany({
    orderBy: {
      data_lembrete: "asc",
    },
  });
}

function buscarPorId(id) {
  return prisma.lembretes.findUnique({
    where: { id },
    include: {
      usuarios: true,
      ...lembreteVinculosInclude,
    },
  });
}

function criar(data) {
  return prisma.lembretes.create({
    data,
    include: lembreteVinculosInclude,
  });
}

function atualizar(id, data) {
  return prisma.lembretes.update({
    where: { id },
    data,
    include: lembreteVinculosInclude,
  });
}

function remover(id) {
  return prisma.lembretes.delete({
    where: { id },
  });
}

function buscarPendentesParaEnvio(dataInicio, dataFim) {
  return prisma.lembretes.findMany({
    where: {
      status: "PENDENTE",
      data_lembrete: {
        gte: dataInicio,
        lte: dataFim,
      },
    },
    include: {
      usuarios: true,
    },
    orderBy: {
      data_lembrete: "asc",
    },
  });
}
function buscarTodosComFiltros({
  status,
  data,
  fazendaIdsPermitidas,
}) {
  const where = {};
  const agora = new Date();

  if (status === "ATRASADO") {
    where.status = "PENDENTE";
    where.data_lembrete = {
      lt: agora,
    };
  } else if (status) {
    where.status = status;
  }

  if (data) {
    const inicio = new Date(data);
    const fim = new Date(data);
    fim.setDate(fim.getDate() + 1);

    where.data_lembrete = {
      ...(where.data_lembrete || {}),
      gte: inicio,
      lt: fim,
    };
  }

  if (fazendaIdsPermitidas === null) {
  } else if (fazendaIdsPermitidas.length === 0) {
    where.fazenda_id = null;
  } else {
    where.OR = [
      { fazenda_id: { in: fazendaIdsPermitidas } },
      { fazenda_id: null },
    ];
  }

  return prisma.lembretes.findMany({
    where,
    orderBy: { data_lembrete: "asc" },
    include: lembreteVinculosInclude,
  });
}

function buscarMarcadoresCalendario({ mes, ano }) {
  return prisma.lembretes.findMany({
    where: {
      data_lembrete: {
        gte: new Date(ano, mes - 1, 1),
        lte: new Date(ano, mes, 0),
      },
    },
  });
}

function buscarPorDia({ data, usuarioId }) {
  const inicio = new Date(data);
  const fim = new Date(data);
  fim.setDate(fim.getDate() + 1);

  return prisma.lembretes.findMany({
    where: {
      usuario_id: usuarioId,
      data_lembrete: {
        gte: inicio,
        lt: fim,
      },
    },
    orderBy: {
      data_lembrete: "asc",
    },
  });
}
function buscarEventosDerivadosDeGasto({ inicio, fim, usuario }) {
  const where = {
    data_vencimento: {
      gte: inicio,
      lte: fim,
    },
  };

  if (usuario.role !== "ADMIN") {
    where.fazenda_id = {
      in: usuario.fazendaIds,
    };
  }

  return prisma.gastos.findMany({
    where,
    orderBy: { data_vencimento: "asc" },
  });
}

function removerTodos() {
  return prisma.lembretes.deleteMany({});
}

export const lembreteRepository = {
  listarTodos,
  buscarPorId,
  criar,
  atualizar,
  remover,
  buscarPendentesParaEnvio,
  buscarTodosComFiltros,
  buscarMarcadoresCalendario,
  buscarPorDia,
  buscarEventosDerivadosDeGasto,
  removerTodos,
};
