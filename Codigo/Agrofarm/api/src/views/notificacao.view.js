const TIPOS_PERMITE_MARCAR_LIDA = new Set(["LEMBRETE", "INSUMO_NOVO", "GASTO_ATRASADO"]);

/** Categoria visual no front (badge vermelho = gasto). */
export function resolverTipoVisual(notificacao) {
  if (!notificacao) return "LEMBRETE";
  if (notificacao.tipo === "INSUMO_NOVO") return "INSUMO_NOVO";
  if (notificacao.tipo === "ARRENDAMENTO_RECEBER") return "ARRENDAMENTO_RECEBER";
  if (notificacao.tipo === "GASTO_ATRASADO") return "GASTO";
  if (notificacao.tipo === "LEMBRETE") {
    const titulo = String(notificacao.titulo ?? "").toLowerCase();
    if (titulo.includes("gasto pendente") || titulo.includes("gasto atrasado")) {
      return "GASTO";
    }
    return "LEMBRETE";
  }
  return notificacao.tipo;
}

const TIPOS_APENAS_ADMIN = new Set(["INSUMO_NOVO", "ARRENDAMENTO_RECEBER", "GASTO_ATRASADO"]);

function render(item) {
  const tipoVisual = resolverTipoVisual(item);
  return {
    id: item.id,
    tipo: item.tipo,
    tipoVisual,
    titulo: item.titulo,
    descricao: item.descricao ?? null,
    rota: item.rota ?? null,
    referenciaId: item.referencia_id ?? null,
    lidaEm: item.lida_em ?? null,
    criadoEm: item.criado_em,
    somenteAdmin: TIPOS_APENAS_ADMIN.has(item.tipo),
    permiteMarcarLida: TIPOS_PERMITE_MARCAR_LIDA.has(item.tipo),
  };
}

function renderMany(items = []) {
  return items.map(render);
}

export const notificacaoView = {
  render,
  renderMany,
  resolverTipoVisual,
};
