/** Valor monetário de um registro de lucro (venda por saca). */
export function valorLucroRegistro(lucro) {
  const sacas = Number(lucro.quantidade_sacas ?? 0);
  const unitario = Number(lucro.valor_unitario ?? 0);
  if (sacas > 0) {
    return sacas * unitario;
  }
  return unitario;
}
