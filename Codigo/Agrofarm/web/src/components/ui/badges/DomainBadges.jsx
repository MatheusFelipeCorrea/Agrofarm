import SoftBadge from "../SoftBadge/SoftBadge.jsx";
import {
  CULTURA_STATUS_LABEL,
  CULTURA_STATUS_TONE,
  ESTOQUE_STATUS_TONE,
  GASTO_STATUS_DISPLAY_TONE,
  HISTORICO_MAPA_STATUS_TONE,
  getGastoDisplayStatus,
  INSUMO_CATEGORIA_TONE,
  LUCRO_RECEBIMENTO_TONE,
  LUCRO_SITUACAO_ATRASADO,
  LUCRO_SITUACAO_VENDA,
  NOTIFICACAO_TIPO_TONE,
  resolveBadgeFromMap,
  USUARIO_ROLE_TONE,
} from "../../../lib/softBadge.js";
import { labelCategoria } from "../../../pages/Insumos/insumosConstants.js";
import { roleLabel } from "../../usuarios/usuariosConstants.js";

export function GastoStatusBadge({ status, dataVencimento, className = "" }) {
  const display = getGastoDisplayStatus(status, dataVencimento);
  const cfg = resolveBadgeFromMap(GASTO_STATUS_DISPLAY_TONE, display, display);
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {cfg.label}
    </SoftBadge>
  );
}

export function EstoqueStatusBadge({ status, className = "" }) {
  const key = status === "ESTOQUE_BAIXO" ? "ESTOQUE_BAIXO" : "EM_ESTOQUE";
  const cfg = resolveBadgeFromMap(ESTOQUE_STATUS_TONE, key);
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {cfg.label}
    </SoftBadge>
  );
}

export function InsumoCategoriaBadge({ categoria, className = "" }) {
  return (
    <SoftBadge tone={INSUMO_CATEGORIA_TONE[categoria] ?? "gray"} className={className}>
      {labelCategoria(categoria)}
    </SoftBadge>
  );
}

export function HistoricoMapaStatusBadge({ status, className = "" }) {
  const cfg = resolveBadgeFromMap(HISTORICO_MAPA_STATUS_TONE, status);
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {cfg.label}
    </SoftBadge>
  );
}

export function CulturaStatusBadge({ status, className = "" }) {
  const label = CULTURA_STATUS_LABEL[status] ?? status;
  return (
    <SoftBadge tone={CULTURA_STATUS_TONE[status] ?? "gray"} className={className}>
      {label}
    </SoftBadge>
  );
}

export function LucroRecebimentoBadge({ status, className = "" }) {
  const cfg = resolveBadgeFromMap(LUCRO_RECEBIMENTO_TONE, status);
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {cfg.label}
    </SoftBadge>
  );
}

/** Coluna Situação na tabela de Lucros (venda, recebimento de arrendamento ou atrasado). */
export function LucroSituacaoBadge({
  origem,
  statusRecebimento,
  parcelaVencida = false,
  className = "",
}) {
  const isArrendamento = origem === "ARRENDAMENTO";

  if (!isArrendamento) {
    return (
      <SoftBadge tone={LUCRO_SITUACAO_VENDA.tone} className={className}>
        {LUCRO_SITUACAO_VENDA.label}
      </SoftBadge>
    );
  }

  if (statusRecebimento === "PENDENTE" && parcelaVencida) {
    return (
      <SoftBadge tone={LUCRO_SITUACAO_ATRASADO.tone} className={className}>
        {LUCRO_SITUACAO_ATRASADO.label}
      </SoftBadge>
    );
  }

  return <LucroRecebimentoBadge status={statusRecebimento} className={className} />;
}

export function UsuarioRoleBadge({ role, className = "" }) {
  const cfg = resolveBadgeFromMap(USUARIO_ROLE_TONE, role, roleLabel(role));
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {roleLabel(role)}
    </SoftBadge>
  );
}

export function UsuarioAtivoBadge({ className = "" }) {
  return (
    <SoftBadge tone="green" className={["gap-1.5", className].filter(Boolean).join(" ")}>
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600 ring-1 ring-emerald-700/20" aria-hidden />
      Ativo
    </SoftBadge>
  );
}

export function CountBadge({ children, tone = "green", className = "" }) {
  return (
    <SoftBadge tone={tone} className={["tabular-nums", className].filter(Boolean).join(" ")}>
      {children}
    </SoftBadge>
  );
}

export function NotificacaoTipoBadge({ tipo, tipoVisual, className = "" }) {
  const key = tipoVisual ?? tipo;
  const cfg = NOTIFICACAO_TIPO_TONE[key] ?? NOTIFICACAO_TIPO_TONE.LEMBRETE;
  return (
    <SoftBadge tone={cfg.tone} className={["uppercase tracking-wide", className].filter(Boolean).join(" ")}>
      {cfg.label}
    </SoftBadge>
  );
}

export function getNotificacaoCardClass(tipo, tipoVisual) {
  const key = tipoVisual ?? tipo;
  const cfg = NOTIFICACAO_TIPO_TONE[key] ?? NOTIFICACAO_TIPO_TONE.LEMBRETE;
  return `border-l-4 ${cfg.card}`;
}
