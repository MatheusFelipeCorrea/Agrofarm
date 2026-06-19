import { describe, expect, it } from "vitest";
import { gastoView } from "../../views/gasto.view.js";

describe("gastoView", () => {
  it("render mapeia campos e relacionamentos", () => {
    const data = new Date("2026-05-01T12:00:00.000Z");
    const resultado = gastoView.render({
      id: "g1",
      colheita_id: "c1",
      tipo: "ADUBO",
      tipo_personalizado: null,
      valor: "150.5",
      data,
      data_vencimento: null,
      status: "PAGO",
      descricao: "teste",
      colheitas: {
        id: "c1",
        ano: 2026,
        data_colheita: data,
        fazendas: { id: "f1", nome: "Fazenda 1" },
        culturas: { id: "cu1", nome: "Soja", cor: "#0f0" },
      },
    });

    expect(resultado).toMatchObject({
      id: "g1",
      colheitaId: "c1",
      tipo: "ADUBO",
      valor: 150.5,
      status: "PAGO",
      fazenda: { id: "f1", nome: "Fazenda 1" },
      cultura: { id: "cu1", nome: "Soja", cor: "#0f0" },
    });
  });

  it("renderResumo converte totais para numero", () => {
    expect(
      gastoView.renderResumo({ totalGasto: "300", totalPago: 100, totalPendente: 200 }),
    ).toEqual({
      totalGasto: 300,
      totalPago: 100,
      totalPendente: 200,
    });
  });

  it("renderMany aplica render em cada item", () => {
    const lista = gastoView.renderMany([
      { id: "g1", colheita_id: "c1", tipo: "ADUBO", valor: 10, data: "2026-01-01", status: "PAGO" },
    ]);
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe("g1");
  });
});
