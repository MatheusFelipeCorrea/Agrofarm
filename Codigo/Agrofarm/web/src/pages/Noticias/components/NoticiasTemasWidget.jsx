import { getTemaIcon } from "../noticiaTemaIcons.js";

export default function NoticiasTemasWidget({ temas = [], categoriaAtiva, onSelectTema }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-gray-900">Principais temas</p>
      <p className="mb-2 text-[11px] text-gray-500">Clique para filtrar por categoria</p>
      <ul className="space-y-1">
        {temas.map((tema) => {
          const Icon = getTemaIcon(tema.id);
          const ativo = categoriaAtiva === tema.id;

          return (
            <li key={tema.id}>
              <button
                type="button"
                onClick={() => onSelectTema?.(tema.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                  ativo
                    ? "bg-[var(--agro-brand)]/10 text-[var(--agro-brand)] ring-1 ring-[var(--agro-brand)]/25"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      ativo ? "bg-white text-[var(--agro-brand)]" : "bg-gray-50 text-[var(--agro-brand)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {tema.label}
                </span>
                <span className={`text-xs font-semibold ${ativo ? "text-[var(--agro-brand)]" : "text-gray-500"}`}>
                  {tema.total}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
