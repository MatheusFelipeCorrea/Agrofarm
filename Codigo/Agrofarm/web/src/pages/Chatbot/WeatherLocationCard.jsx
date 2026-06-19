import Select from "../../components/ui/Select/Select.jsx";
import { weatherCodeLabel } from "./useChatbotWeather.js";

export default function WeatherLocationCard({
  selectClassName,
  tempAtual,
  umidadeAtual,
  codeClima,
  location,
  fazendaOptions,
  activeFazendaId,
  geocoding,
  geoErro,
  onSelectFazenda,
  buscaTexto,
  onBuscaChange,
  buscaAberta,
  resultadosBusca,
  buscando,
  buscaRef,
  onSelectSearchResult,
  atualizadoEm,
  isLoading,
  isError,
}) {
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Clima</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {isLoading
              ? "…"
              : isError
                ? "—"
                : tempAtual != null
                  ? `${Math.round(tempAtual)}°C`
                  : "—"}
            {!isLoading && !isError && umidadeAtual != null ? (
              <span className="ml-2 text-xs font-medium text-slate-600">
                · Umidade {Math.round(umidadeAtual)}%
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {isLoading
              ? "Carregando…"
              : isError
                ? "Indisponível no momento"
                : codeClima != null
                  ? weatherCodeLabel(codeClima)
                  : "—"}
          </p>
        </div>
        <span className="text-2xl" aria-hidden>
          ☁️
        </span>
      </div>

      {fazendaOptions.length > 0 ? (
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">Fazenda / local</span>
          <Select
            value={activeFazendaId}
            onChange={(e) => {
              const id = e.target.value;
              if (id) onSelectFazenda(id);
            }}
            disabled={geocoding}
            placeholder={geocoding ? "Localizando…" : "Escolha uma fazenda"}
            wrapperClassName="relative w-full"
            selectClassName={selectClassName}
            includeEmptyOption
          >
            {fazendaOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
                {f.localizacao ? ` · ${f.localizacao}` : ""}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <p className="mt-2 truncate text-[11px] text-slate-600" title={location.label}>
        Exibindo: <span className="font-medium text-slate-800">{location.label}</span>
      </p>

      {geoErro ? <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{geoErro}</p> : null}

      <div ref={buscaRef} className="relative mt-2">
        <label className="sr-only" htmlFor="chatbot-clima-busca">
          Buscar local para clima
        </label>
        <input
          id="chatbot-clima-busca"
          type="search"
          value={buscaTexto}
          onChange={onBuscaChange}
          placeholder="Buscar cidade ou região…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#22c55e]/50 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/20"
        />
        {buscando ? <p className="mt-1 text-[10px] text-slate-500">Buscando…</p> : null}
        {buscaAberta && resultadosBusca.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg scrollbar-chatbot">
            {resultadosBusca.map((r) => (
              <li key={r.place_id ?? `${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => onSelectSearchResult(r)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Open-Meteo · atualiza a cada ~10 min
        {atualizadoEm ? ` · visto às ${atualizadoEm}` : ""}
      </p>
    </article>
  );
}
