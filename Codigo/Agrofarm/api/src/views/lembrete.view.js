import { calcularStatus } from "../utils/lembrete.utils.js";

function extrairCultura(item) {
  if (item.cultura) return item.cultura;
  if (item.colheitas?.culturas) return item.colheitas.culturas;
  if (item.poligonos_fazenda?.culturas) return item.poligonos_fazenda.culturas;
  return null;
}

function extrairTalhao(item) {
  if (item.talhao) return item.talhao;
  if (item.poligonos_fazenda) {
    const culturaPoligono = item.poligonos_fazenda.culturas?.nome?.trim();
    const nomePoligono = item.poligonos_fazenda.nome?.trim();
    return {
      id: item.poligonos_fazenda.id,
      nome: nomePoligono || culturaPoligono || null,
    };
  }
  return null;
}

function extrairColheita(item) {
  if (item.colheita) return item.colheita;
  if (!item.colheitas) return null;
  return {
    id: item.colheitas.id,
    ano: item.colheitas.ano,
    area: Number(item.colheitas.area),
  };
}

function render(item) {
  const isGasto = item.tipo === "GASTO";

  const fazenda = item.fazenda ?? item.fazendas;
  const cultura = extrairCultura(item);
  const talhao = extrairTalhao(item);
  const colheita = extrairColheita(item);

  return {
    id: item.id,
    tipo: isGasto ? "GASTO" : "LEMBRETE",
    usuarioId: isGasto ? null : item.usuario_id,
    fazendaId: item.fazenda_id,
    fazenda: fazenda
      ? {
          id: fazenda.id,
          nome: fazenda.nome,
        }
      : null,
    colheitaId: isGasto ? null : item.colheita_id ?? null,
    poligonoId: isGasto ? null : item.poligono_id ?? null,
    cultura: cultura
      ? {
          id: cultura.id,
          nome: cultura.nome,
          cor: cultura.cor,
        }
      : null,
    talhao: talhao
      ? {
          id: talhao.id,
          nome: talhao.nome,
        }
      : null,
    colheita,
    valor: item.valor ?? null,
    titulo: item.titulo,
    descricao: item.descricao,
    dataLembrete: item.data_lembrete,
    telefoneWhatsapp: isGasto ? null : item.telefone_whatsapp,
    recorrencia: isGasto ? "NENHUMA" : (item.recorrencia ?? "NENHUMA"),
    recorrenciaCustom: isGasto ? null : (item.recorrencia_custom ?? null),
    status: isGasto ? item.status : calcularStatus(item),
    criadoEm: isGasto ? null : item.criado_em,
  };
}

function renderMany(lembretes) {
  return lembretes.map(render);
}

export const lembreteView = {
  render,
  renderMany,
};
