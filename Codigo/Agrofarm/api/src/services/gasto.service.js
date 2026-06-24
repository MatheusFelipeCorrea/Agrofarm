import { AppError } from "../shared/errors/AppError.js";
import { assertFazendaOperavelPorColheitaId } from "../shared/fazenda/fazendaOperacao.js";
import { gastoRepository } from "../repositories/gasto.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { notificacaoService } from "./notificacao.service.js";

async function resolveFazendasPermitidas({ usuarioId, role }) {
  if (role === "ADMIN") return [];

  const ids = await usuarioRepository.buscarIdsFazendasVinculadas(usuarioId);
  if (!ids.length) {
    throw new AppError("Funcionario sem fazendas vinculadas", 422);
  }

  return ids;
}

function normalizeFiltros({ query, role }) {
  const fazendaId = query.fazendaId;

  if (role !== "ADMIN" && fazendaId === "all") {
    throw new AppError("Parametros de filtro invalidos", 400);
  }

  return {
    fazendaId: fazendaId === "all" ? undefined : fazendaId,
    culturaId: query.culturaId,
    status: query.status,
    from: query.from,
    to: query.to,
  };
}

function normalizeTipoPayload(payload) {
  const tipoUpper = payload.tipo?.toUpperCase?.();

  if (tipoUpper === "OUTRO" && !payload.tipoPersonalizado?.trim()) {
    throw new AppError("Tipo personalizado obrigatorio", 400);
  }

  return {
    tipo: tipoUpper || payload.tipo,
    tipoPersonalizado: tipoUpper === "OUTRO" ? payload.tipoPersonalizado?.trim() ?? null : null,
  };
}

async function validarColheitaPermitida({ colheitaId, fazendasPermitidas, role }) {
  const colheita = await gastoRepository.buscarColheitaPorId(colheitaId);
  if (!colheita) {
    throw new AppError("Colheita nao encontrada", 404);
  }

  if (role !== "ADMIN" && !fazendasPermitidas.includes(colheita.fazenda_id)) {
    throw new AppError("Acesso negado: colheita fora do escopo do usuario", 403);
  }

  return colheita;
}

async function getAll({ usuarioId, role, query }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });
  const filtros = normalizeFiltros({ query, role });
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const [lista, resumo] = await Promise.all([
    gastoRepository.buscarTodosComFiltros({
      filters: filtros,
      role,
      usuarioId,
      fazendasPermitidas,
      page,
      pageSize,
    }),
    gastoRepository.buscarResumoComFiltros({
      filters: filtros,
      role,
      usuarioId,
      fazendasPermitidas,
    }),
  ]);

  return {
    items: lista.items,
    meta: lista.meta,
    totals: resumo,
  };
}

async function getResumo({ usuarioId, role, query }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });
  const filtros = normalizeFiltros({ query, role });

  return gastoRepository.buscarResumoComFiltros({
    filters: filtros,
    role,
    usuarioId,
    fazendasPermitidas,
  });
}

async function getPorColheita({ usuarioId, role, colheitaId, query }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });
  await validarColheitaPermitida({ colheitaId, fazendasPermitidas, role });

  return gastoRepository.buscarPorColheita({
    colheitaId,
    role,
    usuarioId,
    fazendasPermitidas,
    filters: normalizeFiltros({ query, role }),
    page: query.page,
    pageSize: query.pageSize,
  });
}

async function create({ usuarioId, role, payload }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });
  await validarColheitaPermitida({ colheitaId: payload.colheitaId, fazendasPermitidas, role });
  await assertFazendaOperavelPorColheitaId(payload.colheitaId);

  const tipo = normalizeTipoPayload(payload);

  const created = await gastoRepository.create({
    colheita_id: payload.colheitaId,
    tipo: tipo.tipo,
    tipo_personalizado: tipo.tipoPersonalizado,
    valor: payload.valor,
    data: new Date(`${payload.data}T00:00:00`),
    data_vencimento: payload.dataVencimento ? new Date(`${payload.dataVencimento}T00:00:00`) : null,
    status: payload.status,
    descricao: payload.descricao ?? null,
  });

  if (created.status === "PENDENTE") {
    await notificacaoService.sincronizarNotificacoesGastos().catch(() => {});
  } else {
    await notificacaoService.resolverNotificacaoGasto(created.id).catch(() => {});
  }

  return created;
}

async function update({ usuarioId, role, id, payload }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });

  const gastoAtual = await gastoRepository.buscarPorId(id);
  if (!gastoAtual) throw new AppError("Gasto nao encontrado", 404);

  if (role !== "ADMIN" && !fazendasPermitidas.includes(gastoAtual.colheitas?.fazenda_id)) {
    throw new AppError("Gasto nao encontrado", 404);
  }

  const colheitaIdOperacao = payload.colheitaId ?? gastoAtual.colheita_id;
  await assertFazendaOperavelPorColheitaId(colheitaIdOperacao);

  if (payload.colheitaId) {
    await validarColheitaPermitida({ colheitaId: payload.colheitaId, fazendasPermitidas, role });
  }

  const tipo = payload.tipo ? normalizeTipoPayload(payload) : null;

  const updated = await gastoRepository.update(id, {
    ...(payload.colheitaId ? { colheita_id: payload.colheitaId } : {}),
    ...(payload.tipo ? { tipo: tipo.tipo } : {}),
    ...(payload.tipoPersonalizado !== undefined || payload.tipo ? { tipo_personalizado: tipo?.tipoPersonalizado ?? payload.tipoPersonalizado } : {}),
    ...(payload.valor !== undefined ? { valor: payload.valor } : {}),
    ...(payload.data ? { data: new Date(`${payload.data}T00:00:00`) } : {}),
    ...(payload.dataVencimento !== undefined
      ? { data_vencimento: payload.dataVencimento ? new Date(`${payload.dataVencimento}T00:00:00`) : null }
      : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
  });

  if (!updated) throw new AppError("Gasto nao encontrado", 404);

  if (updated.status === "PENDENTE") {
    await notificacaoService.sincronizarNotificacoesGastos().catch(() => {});
  } else {
    await notificacaoService.resolverNotificacaoGasto(updated.id).catch(() => {});
  }

  return updated;
}

async function remove({ usuarioId, role, id }) {
  const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role });
  const gastoAtual = await gastoRepository.buscarPorId(id);
  if (!gastoAtual) throw new AppError("Gasto nao encontrado", 404);

  if (role !== "ADMIN" && !fazendasPermitidas.includes(gastoAtual.colheitas?.fazenda_id)) {
    throw new AppError("Gasto nao encontrado", 404);
  }

  await assertFazendaOperavelPorColheitaId(gastoAtual.colheita_id);

  const removed = await gastoRepository.delete(id);
  if (!removed) throw new AppError("Gasto nao encontrado", 404);

  await notificacaoService.resolverNotificacaoGasto(id).catch(() => {});
}

export const gastoService = {
  getAll,
  getResumo,
  getPorColheita,
  create,
  update,
  delete: remove,
  listar: getAll,
  criar: create,
  atualizar: update,
  remover: remove,
};
