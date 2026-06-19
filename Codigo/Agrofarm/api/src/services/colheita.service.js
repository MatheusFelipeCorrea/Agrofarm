import { AppError } from "../shared/errors/AppError.js";
import { assertFazendaOperavelPorId } from "../shared/fazenda/fazendaOperacao.js";
import { colheitaRepository } from "../repositories/colheita.repository.js";
import { prisma } from "../database/client.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";

async function getFazendaIdsPermitidas({ usuarioId, role }) {
  if (role === "ADMIN") return null;

  const ids = await usuarioRepository.buscarIdsFazendasVinculadas(usuarioId);
  if (!ids.length) {
    throw new AppError("Funcionario sem fazendas vinculadas", 422);
  }

  return ids;
}

async function listar({ usuarioId, role, fazendaId, culturaId, mes, ano, from, to }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });

  const fazendaFiltro = role === "ADMIN"
    ? (fazendaId === "all" ? undefined : fazendaId)
    : undefined;

  return colheitaRepository.buscarTodosComFiltros({
    role,
    fazendaId: fazendaFiltro,
    culturaId,
    mes,
    ano,
    from,
    to,
    fazendaIdsPermitidas,
  });
}

async function buscarPorFazenda({ usuarioId, role, fazendaId }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });

  if (role !== "ADMIN" && !fazendaIdsPermitidas.includes(fazendaId)) {
    throw new AppError("Sem permissao para consultar colheitas desta fazenda", 403);
  }

  return colheitaRepository.buscarPorFazenda({
    fazendaId,
    role,
    fazendaIdsPermitidas,
  });
}

async function criar({ usuarioId, role, payload }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });

  if (role !== "ADMIN" && !fazendaIdsPermitidas.includes(payload.fazendaId)) {
    throw new AppError("Sem permissao para registrar colheita nesta fazenda", 403);
  }

  await assertFazendaOperavelPorId(payload.fazendaId);

  const [fazenda, cultura] = await Promise.all([
    prisma.fazendas.findUnique({ where: { id: payload.fazendaId }, select: { id: true } }),
    prisma.culturas.findUnique({ where: { id: payload.culturaId }, select: { id: true } }),
  ]);

  if (!fazenda) throw new AppError("Fazenda não encontrada", 404);
  if (!cultura) throw new AppError("Cultura não encontrada", 404);

  const culturaVinculada = await prisma.fazenda_culturas.findFirst({
    where: {
      fazenda_id: payload.fazendaId,
      cultura_id: payload.culturaId,
      deletado_em: null,
    },
    select: { id: true },
  });

  if (!culturaVinculada) {
    throw new AppError("A cultura selecionada não está vinculada à fazenda informada", 400);
  }

  const dataColheita = new Date(`${payload.dataColheita}T00:00:00`);
  const duplicada = await prisma.colheitas.findFirst({
    where: {
      fazenda_id: payload.fazendaId,
      cultura_id: payload.culturaId,
      data_colheita: dataColheita,
    },
    select: { id: true },
  });

  if (duplicada) {
    throw new AppError(
      "Já existe uma colheita desta cultura nesta fazenda na mesma data",
      409,
    );
  }

  const created = await colheitaRepository.criar({
    usuarioId,
    role,
    data: {
      fazenda_id: payload.fazendaId,
      cultura_id: payload.culturaId,
      ano: payload.ano ?? Number(payload.dataColheita.slice(0, 4)),
      data_colheita: dataColheita,
      area: payload.area ?? 0,
      sacas_produzidas: payload.sacasProduzidas,
    },
  });

  if (!created) throw new AppError("Acesso negado: fazenda não vinculada ao usuário", 403);
  return created;
}

async function buscarPorId({ usuarioId, role, id }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });
  const colheita = await colheitaRepository.buscarPorId({ role, id, fazendaIdsPermitidas });
  if (!colheita) throw new AppError("Colheita não encontrada (ou sem acesso)", 404);
  return colheita;
}

async function atualizar({ usuarioId, role, id, payload }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });

  const atual = await colheitaRepository.buscarPorId({ role, id, fazendaIdsPermitidas });
  if (!atual) throw new AppError("Colheita não encontrada (ou sem acesso)", 404);

  const fazendaIdOperacao = payload.fazendaId ?? atual.fazenda_id;
  await assertFazendaOperavelPorId(fazendaIdOperacao);

  if (role !== "ADMIN" && payload.fazendaId && !fazendaIdsPermitidas.includes(payload.fazendaId)) {
    throw new AppError("Sem permissao para registrar colheita nesta fazenda", 403);
  }

  const [fazenda, cultura] = await Promise.all([
    payload.fazendaId
      ? prisma.fazendas.findUnique({ where: { id: payload.fazendaId }, select: { id: true } })
      : Promise.resolve(null),
    payload.culturaId
      ? prisma.culturas.findUnique({ where: { id: payload.culturaId }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (payload.fazendaId && !fazenda) throw new AppError("Fazenda não encontrada", 404);
  if (payload.culturaId && !cultura) throw new AppError("Cultura não encontrada", 404);

  const fazendaIdFinal = payload.fazendaId ?? atual.fazenda_id;
  const culturaIdFinal = payload.culturaId ?? atual.cultura_id;

  const culturaVinculada = await prisma.fazenda_culturas.findFirst({
    where: {
      fazenda_id: fazendaIdFinal,
      cultura_id: culturaIdFinal,
      deletado_em: null,
    },
    select: { id: true },
  });

  if (!culturaVinculada) {
    throw new AppError("A cultura selecionada não está vinculada à fazenda informada", 400);
  }

  const updated = await colheitaRepository.atualizar({
    usuarioId,
    role,
    id,
    data: {
      ...(payload.fazendaId ? { fazenda_id: payload.fazendaId } : {}),
      ...(payload.culturaId ? { cultura_id: payload.culturaId } : {}),
      ...(payload.ano !== undefined
        ? { ano: payload.ano }
        : payload.dataColheita
          ? { ano: Number(payload.dataColheita.slice(0, 4)) }
          : {}),
      ...(payload.dataColheita ? { data_colheita: new Date(`${payload.dataColheita}T00:00:00`) } : {}),
      ...(payload.area !== undefined ? { area: payload.area } : {}),
      ...(payload.sacasProduzidas !== undefined ? { sacas_produzidas: payload.sacasProduzidas } : {}),
    },
  });

  if (!updated) throw new AppError("Colheita não encontrada (ou sem acesso)", 404);
  return updated;
}

async function remover({ usuarioId, role, id }) {
  const fazendaIdsPermitidas = await getFazendaIdsPermitidas({ usuarioId, role });
  const existe = await colheitaRepository.buscarPorId({ role, id, fazendaIdsPermitidas });
  if (!existe) throw new AppError("Colheita não encontrada (ou sem acesso)", 404);

  await assertFazendaOperavelPorId(existe.fazenda_id);

  const removed = await colheitaRepository.remover({ usuarioId, role, id });
  if (!removed) throw new AppError("Colheita não encontrada (ou sem acesso)", 404);
  if (removed.blocked) {
    if (removed.reason === "gastos") {
      throw new AppError("Não é possível excluir: colheita possui gastos vinculados", 400);
    }
    if (removed.reason === "lucros") {
      throw new AppError("Não é possível excluir: colheita possui lucros vinculados", 400);
    }
    throw new AppError("Não é possível excluir: colheita possui vínculos", 400);
  }
}

export const colheitaService = {
  listar,
  buscarPorFazenda,
  buscarPorId,
  criar,
  atualizar,
  remover,
};

