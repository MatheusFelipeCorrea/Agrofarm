import { prisma } from "../database/client.js";

function buildWhereBase({ filters, role, fazendasPermitidas }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const where = {
    ...(filters?.status === "PAGO" ? { status: "PAGO" } : {}),
    ...(filters?.status === "PENDENTE" ? { status: "PENDENTE" } : {}),
    ...(filters?.status === "ATRASADO"
      ? {
          status: "PENDENTE",
          data_vencimento: { lt: hoje },
        }
      : {}),
    ...(filters?.from || filters?.to
      ? {
          data: {
            ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}),
            ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
          },
        }
      : {}),
    colheitas: {
      ...(filters?.fazendaId ? { fazenda_id: filters.fazendaId } : {}),
      ...(filters?.culturaId ? { cultura_id: filters.culturaId } : {}),
      ...(role !== "ADMIN" ? { fazenda_id: { in: fazendasPermitidas } } : {}),
    },
  };

  return where;
}

async function buscarTodosComFiltros({ filters, role, fazendasPermitidas, page = 1, pageSize = 20 }) {
  const where = buildWhereBase({ filters, role, fazendasPermitidas });
  const skip = (page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    prisma.gastos.findMany({
      where,
      include: {
        colheitas: {
          include: { fazendas: true, culturas: true },
        },
      },
      orderBy: [{ data: "desc" }, { criado_em: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.gastos.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

async function buscarResumoComFiltros({ filters, role, fazendasPermitidas }) {
  const where = buildWhereBase({ filters, role, fazendasPermitidas });

  const totalsAgg = await prisma.gastos.groupBy({
    by: ["status"],
    where,
    _sum: { valor: true },
  });

  const totalPago = Number(totalsAgg.find((r) => r.status === "PAGO")?._sum?.valor ?? 0);
  const totalPendente = Number(totalsAgg.find((r) => r.status === "PENDENTE")?._sum?.valor ?? 0);

  return {
    totalGasto: totalPago + totalPendente,
    totalPago,
    totalPendente,
  };
}

async function buscarPorColheita({ colheitaId, filters, role, fazendasPermitidas, page = 1, pageSize = 20 }) {
  const where = {
    ...buildWhereBase({ filters, role, fazendasPermitidas }),
    colheita_id: colheitaId,
  };

  const skip = (page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    prisma.gastos.findMany({
      where,
      include: {
        colheitas: {
          include: { fazendas: true, culturas: true },
        },
      },
      orderBy: [{ data: "desc" }, { criado_em: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.gastos.count({ where }),
  ]);

  const totalsAgg = await prisma.gastos.groupBy({
    by: ["status"],
    where,
    _sum: { valor: true },
  });

  const totalPago = Number(totalsAgg.find((r) => r.status === "PAGO")?._sum?.valor ?? 0);
  const totalPendente = Number(totalsAgg.find((r) => r.status === "PENDENTE")?._sum?.valor ?? 0);

  return {
    items,
    totals: {
      totalGasto: totalPago + totalPendente,
      totalPago,
      totalPendente,
    },
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

async function buscarPorId(id) {
  return prisma.gastos.findUnique({
    where: { id },
    include: {
      colheitas: {
        include: { fazendas: true, culturas: true },
      },
    },
  });
}

async function buscarArrendamentosPendentes({ fazendaId, page = 1, pageSize = 20 }) {
  const where = {
    origem: "ARRENDAMENTO",
    status_recebimento: "PENDENTE",
    fazendas: {
      tipo: "ARRENDADA_PARA_TERCEIROS",
      ...(fazendaId ? { id: fazendaId } : {}),
    },
  };

  const skip = (page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    prisma.lucros.findMany({
      where,
      include: {
        fazendas: { select: { id: true, nome: true, tipo: true } },
      },
      orderBy: [{ data: "asc" }, { criado_em: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.lucros.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

async function buscarFazendasComArrendamentoPendente() {
  return prisma.fazendas.findMany({
    where: {
      tipo: "ARRENDADA_PARA_TERCEIROS",
      lucros: {
        some: {
          origem: "ARRENDAMENTO",
          status_recebimento: "PENDENTE",
        },
      },
    },
    select: { id: true, nome: true, tipo: true },
    orderBy: { nome: "asc" },
  });
}

async function somarArrendamentosPendentes({ fazendaId, onlyAtrasados = false }) {
  const where = {
    origem: "ARRENDAMENTO",
    status_recebimento: "PENDENTE",
    fazendas: {
      tipo: "ARRENDADA_PARA_TERCEIROS",
      ...(fazendaId ? { id: fazendaId } : {}),
    },
  };

  if (onlyAtrasados) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    where.data = { lt: hoje };
  }

  const agg = await prisma.lucros.aggregate({
    where,
    _sum: { valor_unitario: true },
  });

  return Number(agg._sum.valor_unitario ?? 0);
}

async function buscarColheitaPorId(id) {
  return prisma.colheitas.findUnique({
    where: { id },
    select: {
      id: true,
      fazenda_id: true,
      cultura_id: true,
    },
  });
}

async function create(data) {
  return prisma.gastos.create({
    data,
    include: { colheitas: { include: { fazendas: true, culturas: true } } },
  });
}

async function update(id, data) {
  return prisma.gastos.update({
    where: { id },
    data,
    include: { colheitas: { include: { fazendas: true, culturas: true } } },
  });
}

async function remove(id) {
  const deleted = await prisma.gastos.deleteMany({ where: { id } });
  return deleted.count > 0;
}

export const gastoRepository = {
  buscarTodosComFiltros,
  buscarResumoComFiltros,
  buscarArrendamentosPendentes,
  buscarFazendasComArrendamentoPendente,
  somarArrendamentosPendentes,
  buscarPorId,
  buscarPorColheita,
  buscarColheitaPorId,
  create,
  update,
  delete: remove,
};
