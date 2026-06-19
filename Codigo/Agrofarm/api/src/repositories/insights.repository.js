import { prisma } from "../database/client.js";
import { valorLucroRegistro } from "../shared/finance/valorLucro.js";

const TIPOS_INSIGHT = ["SAUDACAO", "ESTOQUE", "LUCROS", "ANALISE_FAZENDAS", "FAZENDA_FIXA", "DICA_DIA"];

export { TIPOS_INSIGHT };

export const insightsRepository = {
  salvarSnapshot: async ({ tipo, escopo, fazendaId, conteudo, geradoPor }) => {
    return prisma.insight_snapshots.create({
      data: {
        tipo,
        escopo,
        fazenda_id: fazendaId ?? null,
        conteudo,
        gerado_por: geradoPor,
      },
    });
  },

  buscarUltimoPorTipo: async ({ tipo, escopo, fazendaId }) => {
    return prisma.insight_snapshots.findFirst({
      where: {
        tipo,
        escopo,
        fazenda_id: fazendaId ?? null,
      },
      orderBy: { gerado_em: "desc" },
    });
  },

  buscarUltimosPorEscopo: async ({ escopo, fazendaId }) => {
    const snapshots = await Promise.all(
      TIPOS_INSIGHT.map((tipo) =>
        prisma.insight_snapshots.findFirst({
          where: { tipo, escopo, fazenda_id: fazendaId ?? null },
          orderBy: { gerado_em: "desc" },
        }),
      ),
    );
    return snapshots.filter(Boolean);
  },

  somarLucrosNoPeriodo: async ({ fazendaIds, inicio, fim }) => {
    const lucros = await prisma.lucros.findMany({
      where: {
        data: { gte: inicio, lt: fim },
        colheitas: fazendaIds?.length ? { fazenda_id: { in: fazendaIds } } : undefined,
      },
      select: { quantidade_sacas: true, valor_unitario: true, origem: true },
    });

    return lucros.reduce((acc, l) => acc + valorLucroRegistro(l), 0);
  },

  gastosResumoPorFazenda: async ({ fazendaIds }) => {
    if (!fazendaIds?.length) return [];

    const fazendas = await prisma.fazendas.findMany({
      where: { id: { in: fazendaIds } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    const linhas = await Promise.all(
      fazendas.map(async (fazenda) => {
        const [gastos, lucros] = await Promise.all([
          prisma.gastos.findMany({
            where: { colheitas: { fazenda_id: fazenda.id } },
            select: { valor: true, status: true },
          }),
          prisma.lucros.findMany({
            where: {
              OR: [
                { colheitas: { fazenda_id: fazenda.id } },
                { fazenda_id: fazenda.id, origem: "ARRENDAMENTO" },
              ],
            },
            select: { quantidade_sacas: true, valor_unitario: true, origem: true },
          }),
        ]);

        let totalPago = 0;
        let totalPendente = 0;
        gastos.forEach((g) => {
          const v = Number(g.valor ?? 0);
          if (g.status === "PAGO") totalPago += v;
          else totalPendente += v;
        });

        const totalLucros = lucros.reduce((acc, l) => acc + valorLucroRegistro(l), 0);

        return {
          fazendaId: fazenda.id,
          fazendaNome: fazenda.nome,
          totalPago,
          totalPendente,
          totalGasto: totalPago + totalPendente,
          totalLucros,
          saldo: totalLucros - (totalPago + totalPendente),
        };
      }),
    );

    return linhas;
  },

  estoquePorCultura: async ({ fazendaIds }) => {
    const colheitas = await prisma.colheitas.findMany({
      where: fazendaIds?.length ? { fazenda_id: { in: fazendaIds } } : undefined,
      include: {
        culturas: { select: { id: true, nome: true, cor: true } },
        lucros: { select: { quantidade_sacas: true } },
      },
    });

    const mapa = new Map();

    colheitas.forEach((c) => {
      const culturaId = c.cultura_id;
      const produzidas = Number(c.sacas_produzidas ?? 0);
      const vendidas = (c.lucros ?? []).reduce((acc, l) => acc + Number(l.quantidade_sacas ?? 0), 0);
      const emEstoque = Math.max(produzidas - vendidas, 0);

      if (!mapa.has(culturaId)) {
        mapa.set(culturaId, {
          culturaId,
          nome: c.culturas?.nome ?? "Cultura",
          cor: c.culturas?.cor ?? "#6b7280",
          emEstoque: 0,
        });
      }
      const item = mapa.get(culturaId);
      item.emEstoque += emEstoque;
    });

    return [...mapa.values()].sort((a, b) => b.emEstoque - a.emEstoque);
  },
};
