import { describe, expect, it } from "vitest";
import { lucroView } from "../../views/lucro.view.js";

describe("lucroView", () => {
  it("render calcula total e mapeia relacionamentos", () => {
    const data = new Date("2026-05-01T12:00:00.000Z");
    const resultado = lucroView.render({
      id: "l1",
      origem: "VENDA_COLHEITA",
      colheita_id: "c1",
      quantidade_sacas: 10,
      valor_unitario: 150,
      comprador: "Cooperativa",
      data,
      colheitas: {
        id: "c1",
        ano: 2026,
        data_colheita: data,
        fazendas: { id: "f1", nome: "Fazenda" },
        culturas: { id: "cu1", nome: "Soja", cor: "#0f0" },
      },
    });

    expect(resultado).toMatchObject({
      id: "l1",
      quantidadeSacas: 10,
      valorUnitario: 150,
      total: 1500,
      comprador: "Cooperativa",
    });
  });

  it("renderTotal converte para numero", () => {
    expect(lucroView.renderTotal({ totalLucro: "2500.5", totalPendenteArrendamento: 100 })).toEqual({
      totalLucro: 2500.5,
      totalPendenteArrendamento: 100,
    });
  });
});
