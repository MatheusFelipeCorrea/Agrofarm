import { describe, expect, it } from "vitest";
import {
  normalizarPergunta,
  perguntaAnaliticaOuOpiniao,
  perguntaExigeAnaliseCompleta,
  tentarRespostaConsultaRapida,
} from "../../services/chatbot.consultasRapidas.js";

const ctxMinimo = {
  resumoGeral: {
    totalLucros: 100000,
    totalGastos: 40000,
    saldoAproximado: 60000,
    colheitasTotal: 5,
    gastosPendentes: { quantidade: 2, valorTotal: 5000 },
  },
  fazendas: [{ id: "f1", nome: "Fazenda Sol", hectaresTotais: 100, culturasVinculadas: [] }],
  financeiroPorFazenda: [
    { fazendaId: "f1", fazendaNome: "Fazenda Sol", totalLucros: 100000, totalGastos: 40000, saldo: 60000 },
  ],
  estoquePorFazenda: [],
  producaoPorCulturaAgregada: [],
  mercado: { dolar: { valor: 5.2, variacao: 0.5 }, commodities: [] },
};

describe("chatbot.consultasRapidas", () => {
  it("detecta perguntas analíticas com compare em inglês", () => {
    const q = normalizarPergunta("Compare minhas fazendas e diga onde investir");
    expect(perguntaAnaliticaOuOpiniao(q)).toBe(true);
    expect(perguntaExigeAnaliseCompleta(q)).toBe(true);
  });

  it("não usa consulta rápida em pergunta composta factual + priorizar", () => {
    const pergunta = "Quais gastos pendentes eu tenho e o que priorizar?";
    expect(tentarRespostaConsultaRapida(ctxMinimo, pergunta)).toBeNull();
  });

  it("responde saldo factual direto do banco", () => {
    const resposta = tentarRespostaConsultaRapida(ctxMinimo, "Qual meu saldo?");
    expect(resposta).toContain("Saldo");
    expect(resposta).toContain("R$");
  });

  it("responde cotação do dólar sem commodity", () => {
    const resposta = tentarRespostaConsultaRapida(ctxMinimo, "Qual a cotação do dólar?");
    expect(resposta).toContain("Dólar");
    expect(resposta).toContain("R$");
  });
});
