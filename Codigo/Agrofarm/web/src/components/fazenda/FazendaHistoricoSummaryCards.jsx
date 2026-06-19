import { createElement } from "react";
import { ClockIcon, GridIcon, LayersIcon, LeafIcon } from "../ui/icons.jsx";
import { formatNumberPtBR } from "../../utils/formatters.js";

function Card({ title, value, suffix, icon }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
        {createElement(icon, { className: "h-5 w-5 text-green-600" })}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-[1.7rem] font-semibold leading-tight tracking-tight text-green-700">
          {formatNumberPtBR(value, { maximumFractionDigits: suffix ? 2 : 0 })}
          {suffix ? <span className="ml-1 text-base font-medium text-gray-500">{suffix}</span> : null}
        </p>
      </div>
    </article>
  );
}

export default function FazendaHistoricoSummaryCards({ kpis, loading }) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="h-[5.25rem] animate-pulse rounded-xl bg-gray-100" />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Mapas históricos" value={kpis?.mapasHistoricos ?? 0} icon={GridIcon} />
      <Card title="Áreas colhidas" value={kpis?.areasColhidas ?? 0} suffix="ha" icon={LeafIcon} />
      <Card title="Hectares no histórico" value={kpis?.hectaresNoHistorico ?? 0} suffix="ha" icon={LayersIcon} />
      <Card title="Rotações registradas" value={kpis?.rotacoesRegistradas ?? 0} icon={ClockIcon} />
    </section>
  );
}
