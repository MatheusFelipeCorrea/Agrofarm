/** Valor monetário de um registro de lucro (venda por saca ou arrendamento fixo). */
export function valorLucroRegistro(lucro) {
  const sacas = Number(lucro.quantidade_sacas ?? 0);
  const unitario = Number(lucro.valor_unitario ?? 0);
  if (lucro.origem === "ARRENDAMENTO") {
    return unitario;
  }
  if (sacas > 0) {
    return sacas * unitario;
  }
  return unitario;
}
