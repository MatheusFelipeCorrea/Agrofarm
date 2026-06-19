import Select from "../../../components/ui/Select/Select.jsx";
import DateRangeFilter from "../../../components/ui/DateRangeFilter.jsx";
import { FilterIcon, PlusIcon } from "../../../components/ui/icons.jsx";
import { CATEGORIAS } from "../insumosConstants.js";

const SELECT_CLASSNAME =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

export default function InsumosFiltersBar({
  isAdmin,
  draftFilters,
  onChange,
  fazendas,
  itensDisponiveis,
  canClear,
  canApply,
  onFilterCta,
  onOpenNovo,
  disableNovo,
}) {
  const disableFilterButton = !canClear && !canApply;

  return (
    <section className="flex flex-wrap items-end gap-3">
      {isAdmin ? (
        <div className="w-full sm:w-[15rem]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Fazenda</label>
          <Select
            value={draftFilters.fazendaId}
            onChange={(event) => onChange("fazendaId", event.target.value)}
            wrapperClassName="relative w-full"
            selectClassName={SELECT_CLASSNAME}
            includeEmptyOption={false}
            placeholder="Todas as fazendas"
          >
            <option value="all">Todas as fazendas</option>
            {fazendas.map((fazenda) => (
              <option key={fazenda.id} value={fazenda.id}>
                {fazenda.nome}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="w-full sm:w-[14rem]">
        <label className="mb-1 block text-xs font-medium text-gray-500">Categoria</label>
        <Select
          value={draftFilters.categoria}
          onChange={(event) => onChange("categoria", event.target.value)}
          wrapperClassName="relative w-full"
          selectClassName={SELECT_CLASSNAME}
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-[14rem]">
        <label className="mb-1 block text-xs font-medium text-gray-500">Insumo</label>
        <Select
          value={draftFilters.itemNome}
          onChange={(event) => onChange("itemNome", event.target.value)}
          wrapperClassName="relative w-full"
          selectClassName={SELECT_CLASSNAME}
        >
          <option value="">Todos</option>
          {itensDisponiveis.map((itemNome) => (
            <option key={itemNome} value={itemNome}>
              {itemNome}
            </option>
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
        onClick={onFilterCta}
        disabled={disableFilterButton}
        className={`inline-flex h-10 min-w-[9.5rem] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${
          disableFilterButton
            ? "cursor-not-allowed bg-[#0d4f3a]/45"
            : "bg-[#0d4f3a] hover:bg-[#0b3f2f]"
        }`}
      >
        <FilterIcon className="h-4 w-4" />
        {canClear ? "Limpar filtros" : "Filtrar"}
      </button>

      <button
        type="button"
        onClick={onOpenNovo}
        disabled={disableNovo}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f7f3b] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon className="h-4 w-4" />
        Novo Consumo
      </button>
    </section>
  );
}
