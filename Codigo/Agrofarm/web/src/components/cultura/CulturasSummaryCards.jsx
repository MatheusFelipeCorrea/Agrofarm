import { createElement } from "react";
import { GridIcon, LeafIcon, PieChartIcon } from "../ui/icons.jsx";
import { formatHa } from "../../utils/culturaAggregates.js";

function StatCard({ icon, label, value, sublabel, loading }) {
  return (
    <div className="flex flex-1 min-w-[200px] items-center gap-4 rounded-xl border border-gray-200/90 bg-white px-5 py-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
        {createElement(icon, { className: "h-6 w-6 text-green-600" })}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {loading ? (
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-gray-900">{value}</p>
        )}
        <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>
      </div>
    </div>
  );
}

export default function CulturasSummaryCards({ variant = "global", kpis, loading = false }) {
  const isFazenda = variant === "fazenda";

  const cards = isFazenda
    ? [
        {
          icon: LeafIcon,
          label: "Culturas na fazenda",
          value: String(kpis?.totalCadastradas ?? 0),
          sublabel: "Culturas vinculadas a esta propriedade",
        },
        {
          icon: GridIcon,
          label: "Hectares utilizados",
          value: formatHa(kpis?.hectaresUtilizados, { maximumFractionDigits: 1 }),
          sublabel: "Soma de hectares desta fazenda",
        },
        {
          icon: PieChartIcon,
          label: "Área média por cultura",
          value: formatHa(kpis?.areaMediaPorCultura, { maximumFractionDigits: 1 }),
          sublabel: "Média entre as culturas vinculadas",
        },
      ]
    : [
        {
          icon: LeafIcon,
          label: "Culturas cadastradas",
          value: String(kpis?.totalCadastradas ?? 0),
          sublabel: "Total de culturas registradas",
        },
        {
          icon: GridIcon,
          label: "Hectares utilizados",
          value: formatHa(kpis?.hectaresUtilizados, { maximumFractionDigits: 1 }),
          sublabel: "Soma total de hectares",
        },
        {
          icon: PieChartIcon,
          label: "Área média por cultura",
          value: formatHa(kpis?.areaMediaPorCultura, { maximumFractionDigits: 1 }),
          sublabel: "Média por fazenda vinculada",
        },
      ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </section>
  );
}
