import { RefreshCw } from "lucide-react";
import { formatDateBR } from "../../utils/formatters.js";

function formatarDataHoraInsight(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function InsightCard({
  icon: Icon,
  titulo,
  card,
  loading,
  onRefresh,
  headerExtra,
  children,
  footerExtra,
}) {
  const atualizavel = Boolean(card?.atualizavel && onRefresh);
  const tituloExibido = titulo ?? card?.titulo;

  return (
    <article className="flex flex-col self-start rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {Icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2e5b47] text-white shadow-sm">
              <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden strokeWidth={2} />
            </span>
          ) : null}
          <h2
            className="min-w-0 truncate text-base font-semibold text-gray-900"
            title={tituloExibido || undefined}
          >
            {tituloExibido}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerExtra}
          {atualizavel ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#2e5b47] disabled:opacity-50"
              title="Atualizar insight"
              aria-label="Atualizar insight"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>

      <div>{children}</div>

      {footerExtra}

      {atualizavel && card?.geradoEm ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw className="h-3 w-3" aria-hidden />
          Atualizado em {formatarDataHoraInsight(card.geradoEm)}
        </p>
      ) : null}

      {card?.insuficiente ? (
        <p className="mt-2 text-xs text-amber-600">Dados insuficientes para análise completa.</p>
      ) : null}
    </article>
  );
}
