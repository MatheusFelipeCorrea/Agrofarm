export const colheitaView = {
  render(colheita) {
    return {
      id: colheita.id,
      fazendaId: colheita.fazenda_id,
      culturaId: colheita.cultura_id,
      ano: colheita.ano,
      dataColheita: colheita.data_colheita?.toISOString?.().slice(0, 10) ?? colheita.data_colheita,
      area: Number(colheita.area),
      sacasProduzidas: Number(colheita.sacas_produzidas),
      fazenda: colheita.fazendas
        ? {
            id: colheita.fazendas.id,
            nome: colheita.fazendas.nome,
          }
        : undefined,
      cultura: colheita.culturas
        ? {
            id: colheita.culturas.id,
            nome: colheita.culturas.nome,
            cor: colheita.culturas.cor,
          }
        : undefined,
    };
  },
  renderMany(colheitas) {
    return colheitas.map((c) => colheitaView.render(c));
  },
};

