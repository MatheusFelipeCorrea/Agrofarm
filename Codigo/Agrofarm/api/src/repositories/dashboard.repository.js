import { prisma } from "../database/client.js";
import { valorLucroRegistro } from "../shared/finance/valorLucro.js";

function whereLucrosFazendas(fazendaIds) {
  if (!Array.isArray(fazendaIds) || fazendaIds.length === 0) {
    return { colheitas: withFazendaFiltro(fazendaIds), origem: "VENDA_COLHEITA" };
  }
  return {
    origem: "VENDA_COLHEITA",
    colheitas: withFazendaFiltro(fazendaIds),
  };
}

function withFazendaFiltro(fazendaIds) {
  if (!Array.isArray(fazendaIds) || fazendaIds.length === 0) return {};
  return { fazenda_id: { in: fazendaIds } };
}

export const dashboardRepository = {
  listarFazendasVisiveis: async (usuario) => {
    if (usuario.role === "ADMIN") {
      return prisma.fazendas.findMany({
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      });
    }

    const vinculos = await prisma.usuarios_fazendas.findMany({
      where: { usuario_id: usuario.id },
      include: {
        fazendas: { select: { id: true, nome: true } },
      },
      orderBy: { criado_em: "asc" },
    });

    return vinculos.map((v) => v.fazendas).filter(Boolean);
  },

  producaoPorCultura: async ({ fazendaIds }) => {
    const grouped = await prisma.colheitas.groupBy({
      by: ["cultura_id"],
      where: withFazendaFiltro(fazendaIds),
      _sum: { sacas_produzidas: true, area: true },
    });

    if (grouped.length === 0) return [];

    // A colheita não captura área plantada (o formulário não tem esse campo),
    // então a produtividade (sc/ha) é calculada sobre os hectares mapeados dos
    // talhões da cultura. Usa-se a área da colheita apenas como fallback.
    const hectaresAgg = await prisma.fazenda_culturas.groupBy({
      by: ["cultura_id"],
      where: {
        ...(Array.isArray(fazendaIds) && fazendaIds.length ? { fazenda_id: { in: fazendaIds } } : {}),
        deletado_em: null,
      },
      _sum: { hectares: true },
    });
    const hectaresPorCultura = new Map(
      hectaresAgg.map((row) => [row.cultura_id, Number(row._sum.hectares ?? 0)]),
    );

    const culturas = await prisma.culturas.findMany({
      where: { id: { in: grouped.map((row) => row.cultura_id) } },
      select: { id: true, nome: true, cor: true },
    });

    const culturaMap = new Map(culturas.map((cultura) => [cultura.id, cultura]));

    return grouped.map((row) => {
      const totalSacas = Number(row._sum.sacas_produzidas ?? 0);
      const hectaresMapeados = hectaresPorCultura.get(row.cultura_id) ?? 0;
      const areaColheita = Number(row._sum.area ?? 0);
      const areaProdutiva = hectaresMapeados > 0 ? hectaresMapeados : areaColheita;
      const produtividade = areaProdutiva > 0 ? totalSacas / areaProdutiva : 0;

      return {
        culturaId: row.cultura_id,
        nome: culturaMap.get(row.cultura_id)?.nome ?? "Sem cultura",
        cor: culturaMap.get(row.cultura_id)?.cor ?? "#9ca3af",
        sacas: totalSacas,
        area: areaProdutiva,
        produtividade,
      };
    });
  },

  estoquePorCultura: async ({ fazendaIds }) => {
    const grouped = await prisma.colheitas.groupBy({
      by: ["cultura_id"],
      where: withFazendaFiltro(fazendaIds),
      _sum: { sacas_produzidas: true },
      _max: { data_colheita: true },
    });

    if (grouped.length === 0) return [];

    // Sacas já vendidas (VENDA_COLHEITA) precisam ser abatidas para refletir o
    // estoque real, não a produção histórica acumulada.
    const vendas = await prisma.lucros.findMany({
      where: {
        origem: "VENDA_COLHEITA",
        colheitas: withFazendaFiltro(fazendaIds),
      },
      select: {
        quantidade_sacas: true,
        colheitas: { select: { cultura_id: true } },
      },
    });

    const arrendamentos = await prisma.entregas_arrendamento.findMany({
      where: {
        status: "ENTREGUE",
        colheita_id: { not: null },
        colheitas: withFazendaFiltro(fazendaIds),
      },
      select: {
        quantidade_sacas: true,
        cultura_id: true,
      },
    });

    const vendidoPorCultura = new Map();
    for (const venda of vendas) {
      const culturaId = venda.colheitas?.cultura_id;
      if (!culturaId) continue;
      vendidoPorCultura.set(
        culturaId,
        (vendidoPorCultura.get(culturaId) ?? 0) + Number(venda.quantidade_sacas ?? 0),
      );
    }

    for (const entrega of arrendamentos) {
      const culturaId = entrega.cultura_id;
      if (!culturaId) continue;
      vendidoPorCultura.set(
        culturaId,
        (vendidoPorCultura.get(culturaId) ?? 0) + Number(entrega.quantidade_sacas ?? 0),
      );
    }

    const culturas = await prisma.culturas.findMany({
      where: { id: { in: grouped.map((row) => row.cultura_id) } },
      select: { id: true, nome: true, cor: true },
    });

    const culturaMap = new Map(culturas.map((cultura) => [cultura.id, cultura]));

    return grouped.map((row) => {
      const produzido = Number(row._sum.sacas_produzidas ?? 0);
      const vendido = vendidoPorCultura.get(row.cultura_id) ?? 0;
      const emEstoque = Math.max(produzido - vendido, 0);

      return {
        culturaId: row.cultura_id,
        nome: culturaMap.get(row.cultura_id)?.nome ?? "Sem cultura",
        cor: culturaMap.get(row.cultura_id)?.cor ?? "#9ca3af",
        peso: emEstoque,
        dataColheita: row._max.data_colheita ?? null,
      };
    });
  },

  extratoRecente: async ({ fazendaIds, limite = 6 }) => {
    const whereLucro = whereLucrosFazendas(fazendaIds);
    const whereGasto = {
      colheitas: withFazendaFiltro(fazendaIds),
    };

    const [lucros, gastos] = await Promise.all([
      prisma.lucros.findMany({
        where: whereLucro,
        include: {
          fazendas: { select: { nome: true } },
          colheitas: {
            include: {
              culturas: { select: { nome: true } },
              fazendas: { select: { nome: true } },
            },
          },
        },
        orderBy: [{ data: "desc" }, { criado_em: "desc" }],
        take: limite,
      }),
      prisma.gastos.findMany({
        where: whereGasto,
        include: {
          colheitas: {
            include: {
              culturas: { select: { nome: true } },
              fazendas: { select: { nome: true } },
            },
          },
        },
        orderBy: [{ data: "desc" }, { criado_em: "desc" }],
        take: limite,
      }),
    ]);

    const movimentoLucros = lucros.map((lucro) => {
      const fazendaNome = lucro.colheitas?.fazendas?.nome ?? lucro.fazendas?.nome ?? null;
      const culturaNome = lucro.colheitas?.culturas?.nome ?? null;
      const valor = valorLucroRegistro(lucro);
      const titulo = culturaNome ? `Venda ${culturaNome}` : `Receita — ${lucro.comprador ?? "Sem comprador"}`;

      return {
        id: lucro.id,
        tipo: "LUCRO",
        valor,
        data: lucro.data,
        criadoEm: lucro.criado_em,
        titulo,
        descricao: lucro.comprador ? `Comprador: ${lucro.comprador}` : null,
        fazendaNome,
        culturaNome,
        categoria: "Receita",
        comprador: lucro.comprador ?? null,
        documento: null,
        formaPagamento: null,
        observacao: null,
      };
    });

    const mapCategoriaGasto = (gasto) => {
      const rotulo = String(gasto.tipo_personalizado || gasto.tipo || "").trim();
      const chave = rotulo.toUpperCase();
      if (chave.includes("INSUMO")) return "Insumos";
      if (chave.includes("MANUTEN")) return "Manutenção";
      if (chave.includes("RH") || chave.includes("MAO")) return "RH";
      return rotulo || "Despesa";
    };

    const mapFormaPagamento = (status) => {
      if (!status) return null;
      const mapa = {
        PAGO: "Pago",
        PENDENTE: "Pendente",
        ATRASADO: "Atrasado",
      };
      return mapa[String(status).toUpperCase()] ?? String(status);
    };

    const movimentoGastos = gastos.map((gasto) => ({
      id: gasto.id,
      tipo: "GASTO",
      valor: Number(gasto.valor ?? 0),
      data: gasto.data,
      criadoEm: gasto.criado_em,
      titulo: gasto.tipo_personalizado || gasto.tipo || "Despesa",
      descricao: gasto.descricao ?? null,
      fazendaNome: gasto.colheitas?.fazendas?.nome ?? null,
      culturaNome: gasto.colheitas?.culturas?.nome ?? null,
      categoria: mapCategoriaGasto(gasto),
      comprador: null,
      documento: null,
      formaPagamento: mapFormaPagamento(gasto.status),
      observacao: gasto.descricao ?? null,
      statusPagamento: gasto.status ?? null,
    }));

    return [...movimentoLucros, ...movimentoGastos]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limite);
  },

  totalLucros: async ({ fazendaIds }) => {
    const lucros = await prisma.lucros.findMany({
      where: whereLucrosFazendas(fazendaIds),
      select: { quantidade_sacas: true, valor_unitario: true, origem: true },
    });

    return lucros.reduce((acc, lucro) => acc + valorLucroRegistro(lucro), 0);
  },

  totalGastos: async ({ fazendaIds }) => {
    const result = await prisma.gastos.aggregate({
      where: {
        colheitas: withFazendaFiltro(fazendaIds),
      },
      _sum: { valor: true },
    });

    return Number(result._sum.valor ?? 0);
  },

  /** Estoque (sacas por cultura) agrupado por fazenda — para consultas rápidas no chatbot. */
  estoquePorFazenda: async ({ fazendaIds }) => {
    if (!fazendaIds?.length) return [];

    const grouped = await prisma.colheitas.groupBy({
      by: ["fazenda_id", "cultura_id"],
      where: withFazendaFiltro(fazendaIds),
      _sum: { sacas_produzidas: true },
      _max: { data_colheita: true },
    });

    if (grouped.length === 0) return [];

    // Abate as sacas vendidas por (fazenda, cultura) para refletir estoque real.
    const vendas = await prisma.lucros.findMany({
      where: {
        origem: "VENDA_COLHEITA",
        colheitas: withFazendaFiltro(fazendaIds),
      },
      select: {
        quantidade_sacas: true,
        colheitas: { select: { fazenda_id: true, cultura_id: true } },
      },
    });

    const vendidoPorChave = new Map();
    for (const venda of vendas) {
      const fazendaId = venda.colheitas?.fazenda_id;
      const culturaId = venda.colheitas?.cultura_id;
      if (!fazendaId || !culturaId) continue;
      const chave = `${fazendaId}:${culturaId}`;
      vendidoPorChave.set(
        chave,
        (vendidoPorChave.get(chave) ?? 0) + Number(venda.quantidade_sacas ?? 0),
      );
    }

    const fazendaIdsUnicos = [...new Set(grouped.map((r) => r.fazenda_id))];
    const culturaIds = [...new Set(grouped.map((r) => r.cultura_id))];

    const [fazendas, culturas] = await Promise.all([
      prisma.fazendas.findMany({
        where: { id: { in: fazendaIdsUnicos } },
        select: { id: true, nome: true },
      }),
      prisma.culturas.findMany({
        where: { id: { in: culturaIds } },
        select: { id: true, nome: true },
      }),
    ]);

    const fazendaMap = new Map(fazendas.map((f) => [f.id, f.nome]));
    const culturaMap = new Map(culturas.map((c) => [c.id, c.nome]));

    const porFazenda = new Map();

    for (const row of grouped) {
      const produzido = Number(row._sum.sacas_produzidas ?? 0);
      const vendido = vendidoPorChave.get(`${row.fazenda_id}:${row.cultura_id}`) ?? 0;
      const sacas = Math.max(produzido - vendido, 0);
      if (!porFazenda.has(row.fazenda_id)) {
        porFazenda.set(row.fazenda_id, {
          fazendaId: row.fazenda_id,
          fazendaNome: fazendaMap.get(row.fazenda_id) ?? "Fazenda",
          itens: [],
          totalSacas: 0,
        });
      }
      const bloco = porFazenda.get(row.fazenda_id);
      bloco.itens.push({
        cultura: culturaMap.get(row.cultura_id) ?? "Cultura",
        sacas,
        ultimaColheita: row._max.data_colheita ?? null,
      });
      bloco.totalSacas += sacas;
    }

    return [...porFazenda.values()].sort((a, b) =>
      a.fazendaNome.localeCompare(b.fazendaNome, "pt-BR"),
    );
  },

  /** Lucros, gastos e saldo por fazenda. */
  financeiroPorFazenda: async ({ fazendaIds }) => {
    if (!fazendaIds?.length) return [];

    const fazendas = await prisma.fazendas.findMany({
      where: { id: { in: fazendaIds } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    const linhas = await Promise.all(
      fazendas.map(async (fazenda) => {
        const [totalLucros, totalGastos] = await Promise.all([
          dashboardRepository.totalLucros({ fazendaIds: [fazenda.id] }),
          dashboardRepository.totalGastos({ fazendaIds: [fazenda.id] }),
        ]);
        const lucros = Number(totalLucros);
        const gastos = Number(totalGastos);
        return {
          fazendaId: fazenda.id,
          fazendaNome: fazenda.nome,
          totalLucros: lucros,
          totalGastos: gastos,
          saldo: lucros - gastos,
        };
      }),
    );

    return linhas;
  },

  /** Maior gasto registrado (valor único mais alto). */
  buscarMaiorGasto: async ({ fazendaIds, fazendaId }) => {
    const filtroFazenda = fazendaId
      ? { fazenda_id: fazendaId }
      : withFazendaFiltro(fazendaIds);

    const gasto = await prisma.gastos.findFirst({
      where: { colheitas: filtroFazenda },
      orderBy: { valor: "desc" },
      include: {
        colheitas: {
          include: {
            fazendas: { select: { id: true, nome: true } },
            culturas: { select: { nome: true } },
          },
        },
      },
    });

    if (!gasto) return null;

    return {
      valor: Number(gasto.valor ?? 0),
      descricao: gasto.tipo_personalizado || gasto.tipo || "Despesa",
      data: gasto.data,
      status: gasto.status,
      fazendaId: gasto.colheitas?.fazendas?.id ?? null,
      fazendaNome: gasto.colheitas?.fazendas?.nome ?? null,
      culturaNome: gasto.colheitas?.culturas?.nome ?? null,
    };
  },
};