import { createElement } from "react";
import { ClockIcon, GridIcon, LeafIcon, TrendingUpIcon, UsersIcon } from "../ui/icons.jsx";

function KpiCard({ icon, label, value, loading }) {
  return (
    <div className="flex min-w-[140px] flex-1 items-center gap-4 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
        {createElement(icon, { className: "h-5 w-5 text-green-600" })}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {loading ? (
          <span className="mt-1 inline-block h-7 w-16 animate-pulse rounded bg-gray-200" aria-hidden />
        ) : (
          <p className="mt-0.5 text-xl font-bold tabular-nums leading-tight text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function FazendaDetalheKpiCards({ kpis, loading }) {
  const prod = Number(kpis?.produtividadeMedia ?? 0);
  const prodLabel =
    prod > 0
      ? `${prod.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc/ha`
      : "—";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard icon={LeafIcon} label="Culturas ativas" value={kpis?.culturasAtivas ?? 0} loading={loading} />
      <KpiCard icon={GridIcon} label="Talhões mapeados" value={kpis?.talhoesMapeados ?? 0} loading={loading} />
      <KpiCard icon={ClockIcon} label="Áreas no histórico" value={kpis?.areasNoHistorico ?? 0} loading={loading} />
      <KpiCard icon={TrendingUpIcon} label="Produtividade média" value={prodLabel} loading={loading} />
      <KpiCard
        icon={UsersIcon}
        label="Funcionários vinculados"
        value={kpis?.funcionariosVinculados ?? 0}
        loading={loading}
      />
    </div>
  );
}
