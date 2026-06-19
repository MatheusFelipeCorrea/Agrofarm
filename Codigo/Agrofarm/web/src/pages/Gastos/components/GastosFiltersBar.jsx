import { CalendarIcon, FilterIcon } from "../../../components/ui/icons.jsx";

const FIELD_WRAP = "relative w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm";
const LABEL = "block text-[11px] font-medium leading-none text-gray-500";
const SELECT = "mt-1 h-5 w-full appearance-none bg-transparent pr-6 text-sm font-medium text-gray-700 outline-none";
const DATE_INPUT = "h-5 w-full bg-transparent text-sm font-medium text-gray-700 outline-none";

const BTN_PRIMARY = "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0d4f3a] px-5 text-sm font-semibold text-white shadow-md shadow-[#1a3d30]/20 transition-colors hover:bg-[#0a4230] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d4f3a] focus-visible:ring-offset-2";
const BTN_OUTLINE = "inline-flex h-11 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300";

export default function GastosFiltersBar({
  fazendaId,
  setFazendaId,
  culturaId,
  setCulturaId,
  status,
  setStatus,
  from,
  setFrom,
  to,
  setTo,
  fazendas,
  culturas,
  onApply,
  onClear,
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
      <div className={`${FIELD_WRAP} min-w-[11rem] flex-1 lg:max-w-[11.5rem]`}>
        <label className={LABEL}>Fazenda</label>
        <select value={fazendaId} onChange={(e) => setFazendaId(e.target.value)} className={SELECT}>
          <option value="">Todas as fazendas</option>
          {fazendas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </div>

      <div className={`${FIELD_WRAP} min-w-[11rem] flex-1 lg:max-w-[11.5rem]`}>
        <label className={LABEL}>Cultura</label>
        <select value={culturaId} onChange={(e) => setCulturaId(e.target.value)} className={SELECT}>
          <option value="">Todas as culturas</option>
          {culturas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className={`${FIELD_WRAP} min-w-[11rem] flex-1 lg:max-w-[11rem]`}>
        <label className={LABEL}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
          <option value="">Todos os status</option>
          <option value="PAGO">Pago</option>
          <option value="PENDENTE">Pendente</option>
        </select>
      </div>

      <div className={`${FIELD_WRAP} min-w-[15rem] flex-[1.35] lg:max-w-[18rem]`}>
        <label className={LABEL}>Período</label>
        <div className="mt-1 flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={DATE_INPUT} aria-label="Data inicial" />
          <span className="text-xs text-gray-400">-</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={DATE_INPUT} aria-label="Data final" />
          <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className={BTN_OUTLINE} onClick={onClear}>
          Limpar filtros
        </button>
        <button type="button" className={BTN_PRIMARY} onClick={onApply}>
          <FilterIcon className="h-4 w-4" />
          Filtrar
      </div>
    </div>
  );
}
