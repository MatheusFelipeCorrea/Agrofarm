import { describe, expect, it } from "vitest";
import { colheitaView } from "../../views/colheita.view.js";

describe("colheitaView", () => {
  it("render mapeia colheita com fazenda e cultura", () => {
    const data = new Date("2026-05-10T00:00:00.000Z");
    const resultado = colheitaView.render({
      id: "c1",
      fazenda_id: "f1",
      cultura_id: "cu1",
      ano: 2026,
      data_colheita: data,
      area: "10.5",
      sacas_produzidas: "120",
      fazendas: { id: "f1", nome: "Fazenda" },
      culturas: { id: "cu1", nome: "Soja", cor: "#0f0" },
    });

    expect(resultado).toMatchObject({
      id: "c1",
      area: 10.5,
      sacasProduzidas: 120,
      fazenda: { nome: "Fazenda" },
      cultura: { nome: "Soja" },
    });
  });

  it("renderMany retorna lista", () => {
    expect(colheitaView.renderMany([])).toEqual([]);
  });
});
