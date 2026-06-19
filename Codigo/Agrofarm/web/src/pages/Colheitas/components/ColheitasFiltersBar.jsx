import Select from "../../../components/ui/Select/Select.jsx";
import { FilterIcon } from "../../../components/ui/icons.jsx";
import DateRangeFilter from "../../../components/ui/DateRangeFilter.jsx";

export default function ColheitasFiltersBar({
  isAdmin,
  draftFilters,
  onChange,
  fazendas,
  culturas,
  canClear,
  canApply,
  onFilterCta,
}) {
  const SELECT_CLS =
    "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";
  const buttonDisabled = !canClear && !canApply;

  return (
    <section className="flex flex-wrap items-end gap-3">
      {isAdmin ? (
        <div className="w-full sm:w-[15rem]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Fazenda</label>
          <Select
            value={draftFilters.fazendaId}
            onChange={(e) => onChange("fazendaId", e.target.value)}
            wrapperClassName="relative w-full"
            selectClassName={SELECT_CLS}
            placeholder="Todas as fazendas"
            includeEmptyOption={false}
          >
            <option value="all">Todas as fazendas</option>
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="w-full sm:w-[15rem]">
        <label className="mb-1 block text-xs font-medium text-gray-500">Cultura</label>
        <Select
          value={draftFilters.culturaId}
          onChange={(e) => onChange("culturaId", e.target.value)}
          wrapperClassName="relative w-full"
          selectClassName={SELECT_CLS}
          placeholder="Todas as culturas"
        >
          <option value="">Todas as culturas</option>
          {culturas.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-[19rem]">
        <label className="mb-1 block text-xs font-medium text-gray-500">Periodo</label>
        <DateRangeFilter
          from={draftFilters.from}
          to={draftFilters.to}
          onChangeFrom={(value) => onChange("from", value)}
          onChangeTo={(value) => onChange("to", value)}
          fromPlaceholder="Data inicial"
          toPlaceholder="Data final"
        />
      </div>

      <button
        type="button"
        className={`inline-flex h-10 min-w-[9.5rem] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${
          buttonDisabled
            ? "cursor-not-allowed bg-[#0d4f3a]/45"
            : "bg-[#0d4f3a] hover:bg-[#0b3f2f]"
        }`}
        onClick={onFilterCta}
        disabled={buttonDisabled}
      >
        <FilterIcon className="h-4 w-4" />
        {canClear ? "Limpar filtros" : "Filtrar"}
      </button>
    </section>
  );
}

