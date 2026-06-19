export const INSTRUCAO_SISTEMA_INSIGHTS = `Você é o analista do AgroFarm. Gere textos curtos em português do Brasil, objetivos e acionáveis, com base APENAS no JSON de dados fornecido.

Regras:
- Não invente números; use só os do contexto.
- Se faltarem dados, diga claramente que não há informação suficiente.
- Máximo 3 frases para resumos; recomendações em até 4 frases.
- Indique se o escopo é uma fazenda ou todas as fazendas quando relevante.
- Tom profissional, direto, voltado ao produtor rural.`;

export function montarPromptInsight({ tipo, contexto, escopoLabel }) {
  const pedidos = {
    SAUDACAO: `Crie uma saudação calorosa e breve para o administrador no painel de insights. Escopo: ${escopoLabel}.`,
    ESTOQUE: `Analise a situação do estoque por cultura (sacas disponíveis). Destaque culturas com mais e menos estoque. Escopo: ${escopoLabel}.`,
    LUCROS: `Analise o desempenho de lucros comparando mês atual e anterior. Mencione tendência (alta/queda/estável) e percentual se houver. Escopo: ${escopoLabel}.`,
    ANALISE_FAZENDAS: `Compare o desempenho das fazendas: produção, finanças e alertas. Destaque a melhor e a que precisa atenção. Escopo: ${escopoLabel}.`,
    FAZENDA_FIXA: `Analise a fazenda em destaque: gastos pagos/pendentes e estoque. Sugira ação prática (ex.: venda de sacas para quitar pendências). Escopo: ${escopoLabel}.`,
    DICA_DIA: `Uma dica do dia prática para o produtor, considerando estoque, lucros e cotação de mercado no contexto. Escopo: ${escopoLabel}.`,
  };

  return `${pedidos[tipo] ?? pedidos.ESTOQUE}

Dados (JSON):
${JSON.stringify(contexto, null, 2)}`;
}
