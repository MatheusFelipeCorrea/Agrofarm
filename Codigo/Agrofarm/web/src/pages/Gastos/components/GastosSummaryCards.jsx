import { BanknoteIcon } from "../../../components/ui/icons.jsx";
import { formatBRL } from "../../../utils/formatters.js";

function SummaryCard({ title, value, valueClassName, iconWrapClassName, iconClassName }) {
  return (
    <div className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:gap-3.5 sm:px-5 sm:py-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconWrapClassName}`}
      >
        <BanknoteIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconClassName}`} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">{title}</p>
        <p
          className={`mt-0.5 text-base font-bold tabular-nums leading-tight sm:text-lg ${valueClassName}`}
        >
          {formatBRL(value)}
        </p>
      </div>
    </div>
  );
}

export default function GastosSummaryCards({ totals }) {
  return (
    <section className="w-full">
      <div className="grid w-full grid-cols-3 items-stretch gap-2.5 sm:gap-4">
        <SummaryCard
          title="Total Gasto"
          value={totals.totalGasto}
          valueClassName="text-[#c62828]"
          iconWrapClassName="bg-red-50"
          iconClassName="text-red-600"
        />
        <SummaryCard
          title="Total Pago"
          value={totals.totalPago}
          valueClassName="text-[#2e7d4a]"
          iconWrapClassName="bg-green-50"
          iconClassName="text-green-600"
        />
        <SummaryCard
          title="Total Pendente"
          value={totals.totalPendente}
          valueClassName="text-[#e08c1a]"
          iconWrapClassName="bg-amber-50"
          iconClassName="text-amber-600"
        />
      </div>
    </section>
  );
}
