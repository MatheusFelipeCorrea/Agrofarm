/**
 * Média ponderada global: soma das sacas ÷ soma das áreas produtivas.
 * Mesma lógica de fazenda.service (detalhe) e dashboard.repository (por cultura).
 */
export function calcularProdutividadeMedia(producaoPorCultura = []) {
  const lista = Array.isArray(producaoPorCultura) ? producaoPorCultura : [];
  const totalSacas = lista.reduce((acc, item) => acc + Number(item.sacas ?? 0), 0);
  const totalArea = lista.reduce((acc, item) => acc + Number(item.area ?? 0), 0);
  return totalArea > 0 ? Number((totalSacas / totalArea).toFixed(2)) : 0;
}

export function formatarProdutividadeMedia(valor) {
  const prod = Number(valor ?? 0);
  return prod > 0
    ? `${prod.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc/ha`
    : "—";
}
