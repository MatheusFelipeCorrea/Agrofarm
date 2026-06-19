import { prisma } from "../database/client.js";

function buildDateFilter({ mes, ano, from, to }) {
  // data_colheita é coluna DATE (sem fuso). Usar UTC em todos os limites evita
  // que registros caiam no mês/ano errado perto da virada (Brasil é UTC-3).
  if (from || to) {
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) dateFilter.lte = new Date(`${to}T23:59:59.999Z`);
    return { data_colheita: dateFilter };
  }

  const month = mes ? Number(mes) : undefined;
  const year = ano ? Number(ano) : undefined;

  if (year && month) {
    return {
      data_colheita: {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      },
    };
  }

  if (year) {
    return {
      data_colheita: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    };
  }

  return {};
}

function buildWhere({ fazendaId, culturaId, mes, ano, from, to, role, fazendaIdsPermitidas }) {
  const dateFilter = buildDateFilter({ mes, ano, from, to });

  if (role !== "ADMIN") {
    return {
      ...(fazendaIdsPermitidas?.length ? { fazenda_id: { in: fazendaIdsPermitidas } } : { fazenda_id: "__SEM_ACESSO__" }),
      ...(culturaId ? { cultura_id: culturaId } : {}),
      ...dateFilter,
    };
  }

  return {
    ...(fazendaId ? { fazenda_id: fazendaId } : {}),
    ...(culturaId ? { cultura_id: culturaId } : {}),
    ...dateFilter,
  };
}

async function buscarTodosComFiltros({ fazendaId, culturaId, mes, ano, from, to, role, fazendaIdsPermitidas }) {
  const monthOnly = Boolean(mes && !ano && !from && !to);

  const rows = await prisma.colheitas.findMany({
    where: {
      ...buildWhere({ fazendaId, culturaId, mes, ano, from, to, role, fazendaIdsPermitidas }),
    },
    include: {
      fazendas: true,
      culturas: true,
    },
    orderBy: [{ data_colheita: "desc" }],
  });

  if (monthOnly) {
    const month = Number(mes);
    return rows.filter((row) => {
      const dt = row.data_colheita;
      return dt instanceof Date && dt.getUTCMonth() + 1 === month;
    });
  }

  return rows;
}

async function listar({ usuarioId, role, fazendaId, culturaId, mes, ano, from, to, fazendaIdsPermitidas }) {
  return buscarTodosComFiltros({ usuarioId, role, fazendaId, culturaId, mes, ano, from, to, fazendaIdsPermitidas });
}

async function buscarPorId({ role, id, fazendaIdsPermitidas }) {
  return prisma.colheitas.findFirst({
    where: {
      id,
      ...(role === "ADMIN" ? {} : { fazenda_id: { in: fazendaIdsPermitidas ?? [] } }),
    },
    include: {
      fazendas: true,
      culturas: true,
    },
  });
}

async function buscarPorFazenda({ fazendaId, role, fazendaIdsPermitidas }) {
  return prisma.colheitas.findMany({
    where: {
      fazenda_id: fazendaId,
      ...(role === "ADMIN" ? {} : { fazenda_id: { in: fazendaIdsPermitidas ?? [] } }),
    },
    include: {
      fazendas: true,
      culturas: true,
    },
    orderBy: [{ data_colheita: "desc" }],
  });
}

async function criar({ usuarioId, role, data }) {
  if (role !== "ADMIN") {
    // autorização: fazenda precisa estar vinculada ao usuário
    const acesso = await prisma.usuarios_fazendas.findFirst({
      where: { usuario_id: usuarioId, fazenda_id: data.fazenda_id },
      select: { id: true },
    });
    if (!acesso) return null;
  }

  return prisma.colheitas.create({
    data,
    include: { fazendas: true, culturas: true },
  });
}

async function atualizar({ usuarioId, role, id, data }) {
  const current = await buscarPorId({ usuarioId, role, id });
  if (!current) return null;

  // se trocou fazenda, revalida autorização (para não-admin)
  if (role !== "ADMIN" && data.fazenda_id && data.fazenda_id !== current.fazenda_id) {
    const acesso = await prisma.usuarios_fazendas.findFirst({
      where: { usuario_id: usuarioId, fazenda_id: data.fazenda_id },
      select: { id: true },
    });
    if (!acesso) return null;
  }

  return prisma.colheitas.update({
    where: { id },
    data,
    include: { fazendas: true, culturas: true },
  });
}

async function remover({ usuarioId, role, id }) {
  const current = await buscarPorId({ usuarioId, role, id });
  if (!current) return null;

  // Verificação de vínculos + exclusão na mesma transação, evitando corrida em
  // que um gasto/lucro é inserido entre a checagem e o delete.
  return prisma.$transaction(async (tx) => {
    const gastosCount = await tx.gastos.count({ where: { colheita_id: id } });
    if (gastosCount > 0) return { blocked: true, reason: "gastos" };

    const lucrosCount = await tx.lucros.count({ where: { colheita_id: id } });
    if (lucrosCount > 0) return { blocked: true, reason: "lucros" };

    await tx.colheitas.delete({ where: { id } });
    return { success: true };
  });
}

export const colheitaRepository = {
  buscarTodosComFiltros,
  listar,
  buscarPorId,
  buscarPorFazenda,
  criar,
  atualizar,
  remover,
};

