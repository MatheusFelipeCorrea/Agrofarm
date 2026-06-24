import { BanknoteIcon } from "../../components/ui/icons.jsx";
import { formatBRL } from "../../utils/formatters.js";

export default function LucroTotalCard({ total }) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 items-center gap-5 rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <BanknoteIcon className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total de vendas</p>
          <p className="mt-0.5 text-xs text-gray-400">Receitas confirmadas de venda de sacas</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-[#2e7d32]">
            {formatBRL(total)}
          </p>
        </div>
      </div>
    </div>
  );
}
