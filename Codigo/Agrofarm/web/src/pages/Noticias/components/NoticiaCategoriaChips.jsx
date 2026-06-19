const CHIP_BASE =
  "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors";

export default function NoticiaCategoriaChips({ categorias, ativa, onChange, totaisPorCategoria = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(categorias ?? []).map((cat) => {
        const selected = ativa === cat.id;
        const total = totaisPorCategoria[cat.id];
        const mostraTotal = cat.id !== "TODAS" && total != null;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`${CHIP_BASE} gap-2 ${
              selected
                ? "border-[var(--agro-brand)] bg-[var(--agro-brand)] text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span>{cat.label}</span>
            {mostraTotal ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {total}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
