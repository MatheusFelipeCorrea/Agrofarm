import { prisma } from "../database/client.js";

export const simulacaoRepository = {
  buscarCulturaPorId: async (id) => {
    if (!id) return null;
    return prisma.culturas.findUnique({
      where: { id },
      select: { id: true, nome: true, cor: true },
    });
  },

  criar: async (dados) => {
    return prisma.simulacoes.create({
      data: {
        usuario_id: dados.usuario_id,
        fazenda_id: dados.fazenda_id,
        cultura_id: dados.cultura_id,
        quantidade_sacas: dados.quantidade_sacas,
        valor_saca: dados.valor_saca,
        moeda: dados.moeda,
        taxa_cambio_manual: dados.taxa_cambio_manual,
        valor_bruto: dados.valor_bruto,
        valor_liquido: dados.valor_liquido,
        composicao_taxas: dados.composicao_taxas,
        abatimento_divida: dados.abatimento_divida,
        novo_saldo_divida: dados.novo_saldo_divida,
      },
      include: {
        culturas: { select: { id: true, nome: true, cor: true } },
        fazendas: { select: { id: true, nome: true } },
      },
    });
  },

  buscarPorId: async (id) => {
    return prisma.simulacoes.findUnique({
      where: { id },
      include: {
        culturas: { select: { id: true, nome: true, cor: true } },
        fazendas: { select: { id: true, nome: true } },
      },
    });
  },

  excluir: async (id) => {
    return prisma.simulacoes.delete({ where: { id } });
  },

  listarPorUsuario: async ({ usuarioId, fazendaId, limite = 20 }) => {
    const where = { usuario_id: usuarioId };
    if (fazendaId && fazendaId !== "todas") {
      where.fazenda_id = fazendaId;
    }

    return prisma.simulacoes.findMany({
      where,
      include: {
        culturas: { select: { id: true, nome: true, cor: true } },
        fazendas: { select: { id: true, nome: true } },
      },
      orderBy: { criado_em: "desc" },
      take: limite,
    });
  },
};
