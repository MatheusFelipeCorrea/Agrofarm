export const lembreteVinculosInclude = {
  fazendas: { select: { id: true, nome: true } },
  colheitas: {
    include: {
      culturas: { select: { id: true, nome: true, cor: true } },
    },
  },
  poligonos_fazenda: {
    include: {
      culturas: { select: { id: true, nome: true, cor: true } },
    },
  },
};
