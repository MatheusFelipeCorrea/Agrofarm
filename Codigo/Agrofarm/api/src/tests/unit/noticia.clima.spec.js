import { describe, expect, it } from "vitest";
import { calcularScoreClima, pertenceAoClima } from "../../services/noticia/noticia.clima.js";
import { categorizarNoticia } from "../../services/noticia/noticia.categorizar.js";

describe("noticia clima", () => {
  it("prioriza El Niño e fenômenos ENSO", () => {
    const score = calcularScoreClima({
      titulo: "El Niño deve influenciar chuvas da safra 2026 no Centro-Oeste",
      descricao: "Meteorologistas alertam para distribuição irregular de precipitação.",
    });
    expect(score).toBeGreaterThanOrEqual(8);

    const { categoria } = categorizarNoticia({
      titulo: "El Niño deve influenciar chuvas da safra 2026 no Centro-Oeste",
      descricao: "Análise do INMET e CPTEC.",
    });
    expect(categoria).toBe("CLIMA");
  });

  it("não classifica notícia de cotação como clima", () => {
    const { categoria } = categorizarNoticia({
      titulo: "Soja sobe na bolsa de Chicago com dólar mais fraco",
      descricao: "Cotação e exportação seguem em alta.",
    });
    expect(categoria).toBe("MERCADO");
    expect(pertenceAoClima({ categoria, scoreClima: 0, titulo: "Soja sobe", descricao: "Cotação" })).toBe(false);
  });

  it("inclui previsão e frente fria no filtro clima", () => {
    const item = {
      titulo: "Frente fria traz chuva volumosa para o Sul",
      descricao: "Previsão do tempo indica acumulados acima de 80 mm.",
      categoria: "MERCADO",
    };
    expect(pertenceAoClima(item)).toBe(true);
  });
});
