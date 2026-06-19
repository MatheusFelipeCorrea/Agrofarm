import { prisma } from "../database/client.js";

function createDateRangeWhere(from, to) {
  if (!from && !to) return undefined;

  return {
    ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
  };
}

function createScopedWhere({ role, usuarioId, fazendaIdsPermitidas }) {
  if (role === "ADMIN") return {};

  return {
    funcionario_id: usuarioId,
    ...(fazendaIdsPermitidas?.length
      ? { fazenda_id: { in: fazendaIdsPermitidas } }
      : { fazenda_id: "__sem_acesso__" }),
  };
}

function createListWhere({ role, usuarioId, fazendaIdsPermitidas, fazendaId, categoria, itemNome, from, to }) {
  return {
    ...createScopedWhere({ role, usuarioId, fazendaIdsPermitidas }),
    ...(fazendaId ? { fazenda_id: fazendaId } : {}),
    ...(categoria ? { categoria } : {}),
    ...(itemNome ? { item: itemNome } : {}),
    ...(createDateRangeWhere(from, to) ? { data: createDateRangeWhere(from, to) } : {}),
  };
}

function baseInclude() {
  return {
    fazendas: true,
    usuarios: {
      select: {
        id: true,
        nome: true,
      },
    },
  };
}

async function listar({
  role,
  usuarioId,
  fazendaIdsPermitidas,
  fazendaId,
  categoria,
  itemNome,
  from,
  to,
  page,
  pageSize,
}) {
  const where = createListWhere({
    role,
    usuarioId,
    fazendaIdsPermitidas,
    fazendaId,
    categoria,
    itemNome,
    from,
    to,
  });

  const skip = (page - 1) * pageSize;

  const [items, totalItems, aggregateRows, distinctItemsRows] = await Promise.all([
    prisma.insumos_atividades.findMany({
      where,
      include: baseInclude(),
      orderBy: [{ data: "desc" }, { criado_em: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.insumos_atividades.count({ where }),
    prisma.insumos_atividades.findMany({
      where,
      select: { quantidade: true, valor_unitario: true },
    }),
    prisma.insumos_atividades.findMany({
      where: {
        ...createScopedWhere({ role, usuarioId, fazendaIdsPermitidas }),
        ...(fazendaId ? { fazenda_id: fazendaId } : {}),
      },
      distinct: ["item"],
      select: { item: true },
      orderBy: { item: "asc" },
    }),
  ]);

  let totalConsumo = 0;
  let totalQuantidade = 0;

  for (const row of aggregateRows) {
    const quantidade = Number(row.quantidade);
    const valorUnitario = Number(row.valor_unitario);
    totalQuantidade += quantidade;
    totalConsumo += quantidade * valorUnitario;
  }

  return {
    items,
    totals: {
      totalConsumo,
      totalQuantidade,
      totalRegistros: totalItems,
    },
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    itensDisponiveis: distinctItemsRows.map((row) => row.item),
  };
}

async function criar({ usuarioId, data }) {
  return prisma.insumos_atividades.create({
    data: {
      funcionario_id: usuarioId,
      fazenda_id: data.fazenda_id,
      item: data.item,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      valor_unitario: data.valor_unitario,
      fornecedor: data.fornecedor ?? null,
      observacoes: data.observacoes ?? null,
      data: data.data,
    },
    include: baseInclude(),
  });
}

async function buscarPorIdComAcesso({ role, usuarioId, fazendaIdsPermitidas, id }) {
  return prisma.insumos_atividades.findFirst({
    where: {
      id,
      ...createScopedWhere({ role, usuarioId, fazendaIdsPermitidas }),
    },
    include: baseInclude(),
  });
}

async function atualizar({ role, usuarioId, fazendaIdsPermitidas, id, data }) {
  const row = await buscarPorIdComAcesso({ role, usuarioId, fazendaIdsPermitidas, id });
  if (!row) return null;

  return prisma.insumos_atividades.update({
    where: { id },
    data,
    include: baseInclude(),
  });
}

async function remover({ role, usuarioId, fazendaIdsPermitidas, id }) {
  const row = await buscarPorIdComAcesso({ role, usuarioId, fazendaIdsPermitidas, id });
  if (!row) return null;

  await prisma.insumos_atividades.delete({ where: { id } });
  return true;
}

export const insumoRepository = {
  listar,
  criar,
  atualizar,
  remover,
};
