import { AppError } from "../shared/errors/AppError.js";
import { assertFazendaOperavelPorId } from "../shared/fazenda/fazendaOperacao.js";
import { prisma } from "../database/client.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { insumoRepository } from "../repositories/insumo.repository.js";
import { notificacaoService } from "./notificacao.service.js";

function parseDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

async function getAllowedFarmIds({ usuarioId, role }) {
  if (role === "ADMIN") return null;

  const ids = await usuarioRepository.buscarIdsFazendasVinculadas(usuarioId);
  if (!ids.length) {
    throw new AppError("Funcionario sem fazendas vinculadas", 422);
  }

  return ids;
}

function validateSelectedFarmForFuncionario({ role, allowedFarmIds, fazendaId }) {
  if (role === "ADMIN") return;
  if (!fazendaId) return;

  if (!allowedFarmIds.includes(fazendaId)) {
    throw new AppError("Fazenda nao encontrada ou sem acesso", 403);
  }
}

async function buscarInsumoParaMutacao({ role, allowedFarmIds, id }) {
  const where =
    role === "ADMIN"
      ? { id }
      : { id, fazenda_id: { in: allowedFarmIds ?? [] } };

  return prisma.insumos_atividades.findFirst({
    where,
    select: { id: true, fazenda_id: true },
  });
}

async function listar({ usuarioId, role, query }) {
  const allowedFarmIds = await getAllowedFarmIds({ usuarioId, role });

  const fazendaId = query.fazendaId && query.fazendaId !== "all" ? query.fazendaId : undefined;
  validateSelectedFarmForFuncionario({ role, allowedFarmIds, fazendaId });

  return insumoRepository.listar({
    role,
    usuarioId,
    fazendaIdsPermitidas: allowedFarmIds,
    fazendaId,
    categoria: query.categoria,
    itemNome: query.itemNome,
    from: query.from,
    to: query.to,
    page: query.page,
    pageSize: query.pageSize,
  });
}

async function criar({ usuarioId, role, payload }) {
  const allowedFarmIds = await getAllowedFarmIds({ usuarioId, role });
  validateSelectedFarmForFuncionario({ role, allowedFarmIds, fazendaId: payload.fazendaId });
  await assertFazendaOperavelPorId(payload.fazendaId);

  const insumo = await insumoRepository.criar({
    usuarioId,
    data: {
      fazenda_id: payload.fazendaId,
      item: payload.item,
      categoria: payload.categoria,
      quantidade: payload.quantidade,
      unidade: payload.unidade,
      valor_unitario: payload.valorUnitario,
      fornecedor: payload.fornecedor ?? null,
      observacoes: payload.observacao ?? null,
      data: parseDateOnly(payload.data),
    },
  });

  if (role !== "ADMIN") {
    await notificacaoService.notificarNovoInsumoParaAdmins({
      insumo,
      autorId: usuarioId,
    });
  }

  return insumo;
}

async function atualizar({ usuarioId, role, id, payload }) {
  const allowedFarmIds = await getAllowedFarmIds({ usuarioId, role });

  const atual = await buscarInsumoParaMutacao({ role, allowedFarmIds, id });
  if (!atual) {
    throw new AppError("Registro nao encontrado ou sem permissao para editar", 404);
  }

  await assertFazendaOperavelPorId(payload.fazendaId ?? atual.fazenda_id);

  if (payload.fazendaId) {
    validateSelectedFarmForFuncionario({ role, allowedFarmIds, fazendaId: payload.fazendaId });
  }

  const updated = await insumoRepository.atualizar({
    role,
    usuarioId,
    fazendaIdsPermitidas: allowedFarmIds,
    id,
    data: {
      ...(payload.fazendaId ? { fazenda_id: payload.fazendaId } : {}),
      ...(payload.item !== undefined ? { item: payload.item } : {}),
      ...(payload.categoria !== undefined ? { categoria: payload.categoria } : {}),
      ...(payload.quantidade !== undefined ? { quantidade: payload.quantidade } : {}),
      ...(payload.unidade !== undefined ? { unidade: payload.unidade } : {}),
      ...(payload.valorUnitario !== undefined ? { valor_unitario: payload.valorUnitario } : {}),
      ...(payload.fornecedor !== undefined ? { fornecedor: payload.fornecedor } : {}),
      ...(payload.observacao !== undefined ? { observacoes: payload.observacao } : {}),
      ...(payload.data ? { data: parseDateOnly(payload.data) } : {}),
    },
  });

  if (!updated) {
    throw new AppError("Registro nao encontrado ou sem permissao para editar", 404);
  }

  return updated;
}

async function remover({ usuarioId, role, id }) {
  const allowedFarmIds = await getAllowedFarmIds({ usuarioId, role });

  const atual = await buscarInsumoParaMutacao({ role, allowedFarmIds, id });
  if (!atual) {
    throw new AppError("Registro nao encontrado ou sem permissao para excluir", 404);
  }
  await assertFazendaOperavelPorId(atual.fazenda_id);

  const removed = await insumoRepository.remover({
    role,
    usuarioId,
    fazendaIdsPermitidas: allowedFarmIds,
    id,
  });

  if (!removed) {
    throw new AppError("Registro nao encontrado ou sem permissao para excluir", 404);
  }
}

export const insumoService = {
  listar,
  criar,
  atualizar,
  remover,
};
