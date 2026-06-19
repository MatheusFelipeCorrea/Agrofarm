function asNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function asDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function render(row) {
  const quantidade = asNumber(row.quantidade);
  const valorUnitario = asNumber(row.valor_unitario);

  return {
    id: row.id,
    data: asDateString(row.data),
    item: row.item,
    categoria: row.categoria,
    quantidade,
    unidade: row.unidade,
    valorUnitario,
    valorTotal: quantidade * valorUnitario,
    fornecedor: row.fornecedor ?? null,
    observacao: row.observacoes ?? null,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.usuarios?.nome ?? null,
    fazendaId: row.fazenda_id,
    fazendaNome: row.fazendas?.nome ?? null,
  };
}

function renderMany(rows = []) {
  return rows.map(render);
}

function mediaDiaria(totalConsumo, from, to) {
  if (!from || !to) return totalConsumo;

  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);

  return totalConsumo / days;
}

export const insumoView = {
  render,
  renderMany,
  mediaDiaria,
};
