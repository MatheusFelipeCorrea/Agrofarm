import { AppError } from "../shared/errors/AppError.js";
import { prisma } from "../database/client.js";
import { notificacaoRepository } from "../repositories/notificacao.repository.js";

const TIPOS_SEM_MARCAR_LIDA = new Set(["ARRENDAMENTO_RECEBER"]);
const TIPOS_APENAS_ADMIN = new Set(["INSUMO_NOVO", "ARRENDAMENTO_RECEBER", "GASTO_ATRASADO"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function referenciaUuidValida(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

function formatarDataPtBr(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "data inválida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarDataCurta(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function inicioDoDia(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasEmAtraso(dataVencimento) {
  const hoje = inicioDoDia();
  const vencimento = inicioDoDia(dataVencimento);
  const diffMs = hoje.getTime() - vencimento.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

async function sincronizarNotificacoesDeLembretes(usuarioId) {
  const agora = new Date();
  const lembretes = await prisma.lembretes.findMany({
    where: {
      usuario_id: usuarioId,
      status: "PENDENTE",
      data_lembrete: { gte: agora },
    },
    select: {
      id: true,
      titulo: true,
      data_lembrete: true,
      criado_em: true,
    },
    orderBy: { data_lembrete: "asc" },
    take: 12,
  });

  if (!lembretes.length) return;

  const payload = lembretes.map((lembrete) => ({
    usuario_id: usuarioId,
    tipo: "LEMBRETE",
    titulo: `Lembrete: ${lembrete.titulo}`,
    descricao: `Agendado para ${formatarDataPtBr(lembrete.data_lembrete)}`,
    rota: "/lembretes",
    referencia_id: lembrete.id,
    criado_em: lembrete.criado_em,
    atualizado_em: lembrete.criado_em,
  }));

  await notificacaoRepository.criarMuitas(payload);
}

const DIAS_ANTECEDENCIA_ARRENDAMENTO = 7;

async function sincronizarNotificacoesArrendamento() {
  const hoje = inicioDoDia();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + DIAS_ANTECEDENCIA_ARRENDAMENTO);

  const entregasPendentes = await prisma.entregas_arrendamento.findMany({
    where: {
      status: "PENDENTE",
      data: { lte: limite },
    },
    include: {
      fazendas: { select: { id: true, nome: true } },
      culturas: { select: { id: true, nome: true } },
    },
  });

  const admins = await prisma.usuarios.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admins.length) return;

  if (entregasPendentes.length) {
    const payload = [];
    for (const admin of admins) {
      for (const entrega of entregasPendentes) {
        const fazendaNome = entrega.fazendas?.nome ?? "fazenda";
        const culturaNome = entrega.culturas?.nome ?? "cultura";
        const qtd = Number(entrega.quantidade_sacas ?? 0);
        const dataStr = formatarDataCurta(entrega.data);
        payload.push({
          usuario_id: admin.id,
          tipo: "ARRENDAMENTO_RECEBER",
          titulo: `Arrendamento — ${fazendaNome}`,
          descricao: `${qtd} sacas de ${culturaNome} previstas para ${dataStr || "entrega"}. Confirme a saída do estoque.`,
          rota: `/estoque?pendenteArrendamento=1`,
          referencia_id: entrega.id,
        });
      }
    }
    await notificacaoRepository.criarMuitas(payload);
  }

  const idsPendentes = new Set(entregasPendentes.map((p) => p.id));

  const notificacoesAtivas = await prisma.notificacoes.findMany({
    where: { tipo: "ARRENDAMENTO_RECEBER" },
    select: { id: true, referencia_id: true },
  });

  const idsRemover = notificacoesAtivas
    .filter((n) => !n.referencia_id || !idsPendentes.has(n.referencia_id))
    .map((n) => n.id);

  if (idsRemover.length) {
    await prisma.notificacoes.deleteMany({ where: { id: { in: idsRemover } } });
  }
}

async function resolverNotificacaoArrendamento(entregaId) {
  if (!referenciaUuidValida(entregaId)) return;
  await prisma.notificacoes.deleteMany({
    where: {
      tipo: "ARRENDAMENTO_RECEBER",
      referencia_id: entregaId,
    },
  });
}

async function resolverNotificacaoGasto(gastoId) {
  if (!referenciaUuidValida(gastoId)) return;
  await prisma.notificacoes.deleteMany({
    where: {
      referencia_id: gastoId,
      OR: [
        { tipo: "GASTO_ATRASADO" },
        {
          tipo: "LEMBRETE",
          titulo: { startsWith: "Gasto" },
        },
      ],
    },
  });
}

async function upsertNotificacaoGastoAtrasado({ adminId, gasto, agora }) {
  const fazenda = gasto.colheitas?.fazendas;
  const fazendaId = fazenda?.id;
  const fazendaNome = fazenda?.nome ?? "fazenda";
  const dataVenc = gasto.data_vencimento ?? gasto.data;
  const dataStr = formatarDataCurta(dataVenc);
  const dias = diasEmAtraso(dataVenc);
  const desc = gasto.descricao?.trim() || gasto.tipo || "Gasto";
  const rota = fazendaId ? `/gastos?fazendaId=${fazendaId}` : "/gastos";

  const titulo = `Gasto atrasado — ${fazendaNome}`;
  const descricao =
    dias > 0
      ? `${desc} · venceu em ${dataStr} (${dias} dia${dias === 1 ? "" : "s"} em atraso)`
      : `${desc} · venceu em ${dataStr || "—"}`;

  const existente = await prisma.notificacoes.findFirst({
    where: {
      usuario_id: adminId,
      tipo: "GASTO_ATRASADO",
      referencia_id: gasto.id,
    },
    select: { id: true, lida_em: true },
  });

  if (existente) {
    await prisma.notificacoes.update({
      where: { id: existente.id },
      data: {
        titulo,
        descricao,
        rota,
        atualizado_em: agora,
        // Mantém lida se o admin já marcou; o gasto continua atrasado até ser pago/resolvido.
        ...(existente.lida_em ? { lida_em: existente.lida_em } : {}),
      },
    });
    return;
  }

  await prisma.notificacoes.create({
    data: {
      usuario_id: adminId,
      tipo: "GASTO_ATRASADO",
      titulo,
      descricao,
      rota,
      referencia_id: gasto.id,
      criado_em: agora,
      atualizado_em: agora,
    },
  });
}

async function sincronizarNotificacoesGastos() {
  const hoje = inicioDoDia();

  const gastosAtrasados = await prisma.gastos.findMany({
    where: {
      status: "PENDENTE",
      OR: [
        { data_vencimento: { lt: hoje } },
        { data_vencimento: null, data: { lt: hoje } },
      ],
    },
    include: {
      colheitas: {
        include: {
          fazendas: { select: { id: true, nome: true } },
        },
      },
    },
    orderBy: { data_vencimento: "asc" },
    take: 60,
  });

  const admins = await prisma.usuarios.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admins.length) return;

  const agora = new Date();
  const idsAtivos = new Set(gastosAtrasados.map((g) => g.id));

  if (gastosAtrasados.length) {
    for (const admin of admins) {
      for (const gasto of gastosAtrasados) {
        await upsertNotificacaoGastoAtrasado({ adminId: admin.id, gasto, agora });
      }
    }
  }

  const notificacoesGasto = await prisma.notificacoes.findMany({
    where: {
      OR: [
        { tipo: "GASTO_ATRASADO" },
        {
          tipo: "LEMBRETE",
          titulo: { startsWith: "Gasto" },
        },
      ],
    },
    select: { id: true, referencia_id: true },
  });

  const idsRemover = notificacoesGasto
    .filter((n) => n.referencia_id && !idsAtivos.has(n.referencia_id))
    .map((n) => n.id);

  if (idsRemover.length) {
    await prisma.notificacoes.deleteMany({ where: { id: { in: idsRemover } } });
  }
}

async function sincronizarNotificacoesAdmin() {
  try {
    await Promise.all([
      sincronizarNotificacoesArrendamento(),
      sincronizarNotificacoesGastos(),
    ]);
  } catch (err) {
    console.error("[notificacao] Falha ao sincronizar notificações de admin:", err?.message ?? err);
  }
}

async function listarParaUsuario({ usuario, limit = 20 }) {
  await sincronizarNotificacoesDeLembretes(usuario.id);

  if (usuario.role === "ADMIN") {
    await sincronizarNotificacoesAdmin();
  }

  const [itemsRaw, unreadCount, unreadMarcaveis] = await Promise.all([
    notificacaoRepository.listarPorUsuario({ usuarioId: usuario.id, role: usuario.role, limit: Math.max(limit, 40) }),
    notificacaoRepository.contarNaoLidas({ usuarioId: usuario.id, role: usuario.role }),
    notificacaoRepository.contarNaoLidasMarcaveis({ usuarioId: usuario.id, role: usuario.role }),
  ]);

  const prioridadeTipo = {
    GASTO_ATRASADO: 0,
    ARRENDAMENTO_RECEBER: 1,
    INSUMO_NOVO: 2,
    LEMBRETE: 3,
  };

  const items = [...itemsRaw]
    .sort((a, b) => {
      const pa = prioridadeTipo[a.tipo] ?? 9;
      const pb = prioridadeTipo[b.tipo] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
    })
    .slice(0, limit);

  return { items, unreadCount, unreadMarcaveis };
}

async function marcarComoLida({ usuario, notificacaoId }) {
  const notificacao = await prisma.notificacoes.findFirst({
    where: { id: notificacaoId, usuario_id: usuario.id },
    select: { tipo: true },
  });

  if (!notificacao) {
    throw new AppError("Notificação não encontrada", 404);
  }

  if (TIPOS_APENAS_ADMIN.has(notificacao.tipo) && usuario.role !== "ADMIN") {
    throw new AppError("Notificação não encontrada", 404);
  }

  if (TIPOS_SEM_MARCAR_LIDA.has(notificacao.tipo)) {
    throw new AppError(
      "Esta notificação só é resolvida ao confirmar o recebimento na tela de Lucros",
      400,
    );
  }

  const result = await notificacaoRepository.marcarComoLida({
    usuarioId: usuario.id,
    id: notificacaoId,
  });

  if (result.count === 0) {
    throw new AppError("Notificação não encontrada", 404);
  }
}

async function marcarTodasComoLidas({ usuario }) {
  const result = await notificacaoRepository.marcarTodasComoLidasExcetoTipos({
    usuarioId: usuario.id,
    tiposExcluidos: [...TIPOS_SEM_MARCAR_LIDA],
  });
  return { marcadas: result.count };
}

async function notificarNovoLembrete({ lembrete }) {
  await notificacaoRepository.criarMuitas([
    {
      usuario_id: lembrete.usuario_id,
      tipo: "LEMBRETE",
      titulo: `Lembrete: ${lembrete.titulo}`,
      descricao: `Agendado para ${formatarDataPtBr(lembrete.data_lembrete)}`,
      rota: "/lembretes",
      referencia_id: lembrete.id,
      criado_em: lembrete.criado_em ?? new Date(),
      atualizado_em: lembrete.criado_em ?? new Date(),
    },
  ]);
}

async function notificarNovoInsumoParaAdmins({ insumo, autorId }) {
  const admins = await prisma.usuarios.findMany({
    where: {
      role: "ADMIN",
      ...(autorId ? { id: { not: autorId } } : {}),
    },
    select: { id: true },
  });

  if (!admins.length) return;

  const fazendaNome = insumo.fazendas?.nome ?? "fazenda não informada";
  const fazendaId = insumo.fazenda_id ?? insumo.fazendas?.id;
  if (!fazendaId) return;

  const funcionarioNome = insumo.usuarios?.nome ?? "Funcionário";
  const rota = `/insumos?fazendaId=${fazendaId}`;
  const agora = new Date();
  const hoje = inicioDoDia();

  for (const admin of admins) {
    const existente = await prisma.notificacoes.findFirst({
      where: {
        usuario_id: admin.id,
        tipo: "INSUMO_NOVO",
        referencia_id: fazendaId,
      },
      orderBy: { atualizado_em: "desc" },
      select: { id: true, criado_em: true, descricao: true, lida_em: true },
    });

    if (existente) {
      const criadoHoje = existente.criado_em >= hoje;
      const baseDesc = existente.descricao ?? "";
      const jaMencionaItem = baseDesc.includes(insumo.item);
      const novaDescricao = criadoHoje
        ? jaMencionaItem
          ? baseDesc
          : `${baseDesc ? `${baseDesc} · ` : ""}${funcionarioNome} registrou: ${insumo.item}`
        : `${funcionarioNome} registrou: ${insumo.item}`;

      await prisma.notificacoes.update({
        where: { id: existente.id },
        data: {
          titulo: `Um novo insumo surgiu na fazenda ${fazendaNome}`,
          descricao: novaDescricao,
          rota,
          criado_em: criadoHoje ? existente.criado_em : agora,
          atualizado_em: agora,
          ...(existente.lida_em ? { lida_em: existente.lida_em } : { lida_em: null }),
        },
      });
      continue;
    }

    await prisma.notificacoes.create({
      data: {
        usuario_id: admin.id,
        tipo: "INSUMO_NOVO",
        titulo: `Um novo insumo surgiu na fazenda ${fazendaNome}`,
        descricao: `${funcionarioNome} registrou: ${insumo.item}`,
        rota,
        referencia_id: fazendaId,
        criado_em: agora,
        atualizado_em: agora,
      },
    });
  }
}

export const notificacaoService = {
  listarParaUsuario,
  marcarComoLida,
  marcarTodasComoLidas,
  notificarNovoLembrete,
  notificarNovoInsumoParaAdmins,
  sincronizarNotificacoesArrendamento,
  resolverNotificacaoArrendamento,
  resolverNotificacaoGasto,
  sincronizarNotificacoesGastos,
};
