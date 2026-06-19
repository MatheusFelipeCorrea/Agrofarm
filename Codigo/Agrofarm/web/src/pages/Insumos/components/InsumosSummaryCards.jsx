import { formatBRL, formatNumberPtBR } from "../../../utils/formatters.js";

function KpiCard({ title, value, subtitle, icon, iconWrapClass }) {
  return (
    <div className="flex min-h-[6.5rem] w-full min-w-[10rem] flex-1 flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:min-h-[7rem] sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${iconWrapClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium leading-tight text-gray-700">{title}</p>
          <p className="mt-1 text-xl font-bold leading-tight tabular-nums tracking-tight text-gray-900 sm:text-2xl">{value}</p>
        </div>
      </div>
      <p className="mt-2 pl-[3.25rem] text-left text-xs leading-tight text-gray-500">{subtitle}</p>
    </div>
  );
}

function IconBag() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 8V6a4 4 0 118 0v2h2a2 2 0 012 2v10H6V10a2 2 0 012-2h2zm2 0h4V6a2 2 0 10-4 0v2z" />
    </svg>
  );
}

function IconBasket() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 9h14l-1 11H6L5 9zm2-3a3 3 0 016 0v1H7V6z" />
    </svg>
  );
}

function IconCoin() {
  return <span className="text-sm font-bold leading-none tracking-tight">R$</span>;
}

export default function InsumosSummaryCards({ totals }) {
  const t = totals ?? {
    totalConsumo: 0,
    totalQuantidade: 0,
    totalRegistros: 0,
    mediaPorDia: 0,
  };

  return (
    <section className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <KpiCard
        title="Total de Consumo"
        value={formatBRL(t.totalConsumo)}
        subtitle="Período selecionado"
        iconWrapClass="bg-[#e8f5e9] text-[#2e7d32]"
        icon={<IconBag />}
      />
      <KpiCard
        title="Total em Quantidade"
        value={formatNumberPtBR(t.totalQuantidade, { maximumFractionDigits: 2 })}
        subtitle="kg / L / un"
        iconWrapClass="bg-[#e3f2fd] text-[#1565c0]"
        icon={<IconBag />}
      />
      <KpiCard
        title="Total de Registros"
        value={String(t.totalRegistros ?? 0)}
        subtitle="Lançamentos realizados"
        iconWrapClass="bg-[#f3e5f5] text-[#7b1fa2]"
        icon={<IconBasket />}
      />
      <KpiCard
        title="Média por Dia"
        value={formatBRL(t.mediaPorDia ?? 0)}
        subtitle="Gasto médio diário"
        iconWrapClass="bg-[#fff8e1] text-[#c49000]"
        icon={<IconCoin />}
      />
    </section>
  );
}
