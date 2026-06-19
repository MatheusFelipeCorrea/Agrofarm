import { BanknoteIcon } from "../../components/ui/icons.jsx";
import { formatBRL } from "../../utils/formatters.js";

export default function LucroTotalCard({ total, pendenteArrendamento = 0 }) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 items-center gap-5 rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <BanknoteIcon className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total confirmado</p>
          <p className="mt-0.5 text-xs text-gray-400">Vendas + arrendamentos marcados como recebidos</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-[#2e7d32]">
            {formatBRL(total)}
          </p>
        </div>
      </div>

      {pendenteArrendamento > 0 ? (
        <div className="flex flex-1 items-center gap-5 rounded-xl border border-amber-200 bg-amber-50/80 px-6 py-5 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <BanknoteIcon className="h-7 w-7 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">Arrendamento pendente</p>
            <p className="mt-0.5 text-xs text-amber-800/80">Aguardando sua confirmação na tabela</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-amber-900">
              {formatBRL(pendenteArrendamento)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
