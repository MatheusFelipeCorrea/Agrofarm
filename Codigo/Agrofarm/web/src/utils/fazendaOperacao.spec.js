import { describe, expect, it } from "vitest";
import {
  TIPO_FAZENDA_SOMENTE_LEITURA,
  FAZENDA_SOMENTE_LEITURA_TOOLTIP,
  FAZENDA_SOMENTE_LEITURA_MENSAGEM,
  FAZENDA_SEM_CULTURAS_VINCULADAS_MENSAGEM,
  FAZENDA_SEM_CULTURAS_VINCULADAS_LUCRO_MENSAGEM,
  isFazendaSomenteLeitura,
  podeOperarFazenda,
} from "./fazendaOperacao.js";

describe("fazendaOperacao", () => {
  it("exporta constantes de mensagens", () => {
    expect(TIPO_FAZENDA_SOMENTE_LEITURA).toBe("ARRENDADA_PARA_TERCEIROS");
    expect(FAZENDA_SOMENTE_LEITURA_TOOLTIP).toContain("consulta");
    expect(FAZENDA_SOMENTE_LEITURA_MENSAGEM).toContain("arrendada");
    expect(FAZENDA_SEM_CULTURAS_VINCULADAS_MENSAGEM).toContain("colheitas");
    expect(FAZENDA_SEM_CULTURAS_VINCULADAS_LUCRO_MENSAGEM).toContain("lucros");
  });

  it("isFazendaSomenteLeitura retorna false para fazenda nula", () => {
    expect(isFazendaSomenteLeitura(null)).toBe(false);
  });

  it("isFazendaSomenteLeitura respeita flag somenteLeitura", () => {
    expect(isFazendaSomenteLeitura({ somenteLeitura: true })).toBe(true);
    expect(isFazendaSomenteLeitura({ somenteLeitura: false, tipo: TIPO_FAZENDA_SOMENTE_LEITURA })).toBe(false);
  });

  it("isFazendaSomenteLeitura detecta tipo ARRENDADA_PARA_TERCEIROS", () => {
    expect(isFazendaSomenteLeitura({ tipo: "ARRENDADA_PARA_TERCEIROS" })).toBe(true);
    expect(isFazendaSomenteLeitura({ tipo: "PROPRIA" })).toBe(false);
  });

  it("podeOperarFazenda retorna true para fazenda nula", () => {
    expect(podeOperarFazenda(null)).toBe(true);
  });

  it("podeOperarFazenda respeita flag podeOperar", () => {
    expect(podeOperarFazenda({ podeOperar: false })).toBe(false);
    expect(podeOperarFazenda({ podeOperar: true, tipo: TIPO_FAZENDA_SOMENTE_LEITURA })).toBe(true);
  });

  it("podeOperarFazenda nega operação em fazenda somente leitura", () => {
    expect(podeOperarFazenda({ tipo: "ARRENDADA_PARA_TERCEIROS" })).toBe(false);
    expect(podeOperarFazenda({ tipo: "PROPRIA" })).toBe(true);
  });
});
