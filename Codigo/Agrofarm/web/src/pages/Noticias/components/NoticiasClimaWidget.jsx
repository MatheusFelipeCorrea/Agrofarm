import { CloudSunIcon, DropletIcon, WindIcon } from "../../../components/ui/icons.jsx";
import { weatherCodeLabel } from "../../Chatbot/useChatbotWeather.js";

export default function NoticiasClimaWidget({
  location,
  temperatura,
  codeClima,
  umidade,
  vento,
  chuva,
  isLoading,
  isError,
  onVerPrevisaoCompleta,
}) {
  const label = isLoading
    ? "Carregando…"
    : isError
      ? "Indisponível"
      : codeClima != null
        ? weatherCodeLabel(codeClima)
        : "—";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <CloudSunIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">Clima em destaque</p>
          <p className="text-[11px] text-gray-500 line-clamp-1">{location?.label ?? "Sua região"}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-4xl font-bold tracking-tight text-gray-900">
          {temperatura != null && !isError ? `${Math.round(temperatura)}°C` : "—"}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-700">{label}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 px-2 py-2">
          <DropletIcon className="mx-auto h-4 w-4 text-sky-600" />
          <p className="mt-1 text-[10px] text-gray-500">Umidade</p>
          <p className="text-xs font-semibold text-gray-800">
            {umidade != null && !isError ? `${umidade}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-2">
          <WindIcon className="mx-auto h-4 w-4 text-sky-600" />
          <p className="mt-1 text-[10px] text-gray-500">Vento</p>
          <p className="text-xs font-semibold text-gray-800">
            {vento != null && !isError ? `${vento} km/h` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-2">
          <CloudSunIcon className="mx-auto h-4 w-4 text-sky-600" />
          <p className="mt-1 text-[10px] text-gray-500">Chuva</p>
          <p className="text-xs font-semibold text-gray-800">
            {chuva != null && !isError ? `${chuva} mm` : "—"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onVerPrevisaoCompleta}
        className="mt-4 flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition-colors hover:border-[var(--agro-brand)]/30 hover:bg-gray-50"
      >
        Ver previsão completa
      </button>
    </section>
  );
}
