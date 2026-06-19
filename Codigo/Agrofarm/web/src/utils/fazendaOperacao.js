export const TIPO_FAZENDA_SOMENTE_LEITURA = 'ARRENDADA_PARA_TERCEIROS'

export const FAZENDA_SOMENTE_LEITURA_TOOLTIP =
  'Fazenda arrendada para terceiros: apenas consulta. Dados operacionais não podem ser alterados.'

export const FAZENDA_SOMENTE_LEITURA_MENSAGEM =
  'Esta fazenda é arrendada para terceiros e permite apenas consulta. Não é possível alterar dados operacionais.'

export const FAZENDA_SEM_CULTURAS_VINCULADAS_MENSAGEM =
  'Esta fazenda não possui culturas vinculadas. Vincule culturas em Fazendas para poder registrar colheitas.'

export const FAZENDA_SEM_CULTURAS_VINCULADAS_LUCRO_MENSAGEM =
  'Esta fazenda não possui culturas vinculadas. Vincule culturas em Fazendas para poder registrar lucros.'

export function isFazendaSomenteLeitura(fazenda) {
  if (!fazenda) return false
  if (typeof fazenda.somenteLeitura === 'boolean') return fazenda.somenteLeitura
  return fazenda.tipo === TIPO_FAZENDA_SOMENTE_LEITURA
}

export function podeOperarFazenda(fazenda) {
  if (!fazenda) return true
  if (typeof fazenda.podeOperar === 'boolean') return fazenda.podeOperar
  return !isFazendaSomenteLeitura(fazenda)
}
