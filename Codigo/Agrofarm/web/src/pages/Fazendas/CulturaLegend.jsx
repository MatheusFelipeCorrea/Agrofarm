import { useCulturaListQuery } from "../../queries/cultura/useCulturaQueries.js";

export default function CulturaLegend({ culturaFiltro, onCulturaFilter }) {
  const { data: culturas = [] } = useCulturaListQuery();

  if (culturas.length === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
      <span className="text-xs font-semibold text-gray-200">Legenda de culturas</span>
      {culturas.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onCulturaFilter?.(culturaFiltro === c.id ? null : c.id)}
          className={`inline-flex items-center gap-1.5 text-xs transition-opacity ${
            culturaFiltro && culturaFiltro !== c.id ? "opacity-40" : "opacity-100"
          }`}
        >
          <span
            className="inline-block h-3 w-3 rounded-full border border-white/30 flex-shrink-0"
            style={{ backgroundColor: c.cor ?? "#6b7280" }}
          />
          <span className="text-gray-200">{c.nome}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onCulturaFilter?.(null)}
        className="inline-flex items-center gap-1.5 text-xs transition-opacity"
      >
        <span className="inline-block h-3 w-3 rounded-full border border-white/30 flex-shrink-0 bg-gray-400" />
        <span className="text-gray-200">Sem cultura</span>
      </button>
    </div>
  );
}
