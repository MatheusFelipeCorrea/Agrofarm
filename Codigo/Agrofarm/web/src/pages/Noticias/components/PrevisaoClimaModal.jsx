import { useMemo } from "react";
import { X } from "lucide-react";
import Modal, { ModalContent, ModalDescription, ModalTitle } from "../../../components/ui/Modal/Modal.jsx";
import Select from "../../../components/ui/Select/Select.jsx";
import { CloudSunIcon, DropletIcon, WindIcon } from "../../../components/ui/icons.jsx";
import { useDialogEscapeAndScrollLock } from "../../../hooks/useDialogEscapeAndScrollLock.js";
import { useWeatherForecastQuery } from "../../../queries/weather/useWeatherForecastQuery.js";
import "../../../styles/gerenciamento-usuarios.css";

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-sky-50/80 px-3 py-2.5 text-center ring-1 ring-sky-100">
      <Icon className="mx-auto h-4 w-4 text-sky-700" />
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-sky-800/70">{label}</p>
      <p className="text-sm font-semibold text-sky-950">{value}</p>
    </div>
  );
}

export default function PrevisaoClimaModal({
  open,
  onClose,
  location,
  fazendaOptions = [],
  activeFazendaId = "",
  geocoding = false,
  geoErro = null,
  onSelectFazenda,
}) {
  const lat = location?.lat;
  const lon = location?.lon;

  useDialogEscapeAndScrollLock(open, onClose);

  const { data, isLoading, isError, refetch, isFetching } = useWeatherForecastQuery({
    lat,
    lon,
    enabled: open,
  });

  const atualizadoLabel = useMemo(() => {
    if (!data?.atualizadoEm) return null;
    const d = new Date(data.atualizadoEm);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }, [data?.atualizadoEm]);

  const semCoordenadas = open && (lat == null || lon == null);

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent
        aria-labelledby="previsao-clima-title"
        aria-describedby="previsao-clima-desc"
        className="agro-user-form-dialog__surface z-[201] w-[min(92vw,40rem)] max-h-[min(92dvh,720px)]"
        overlayClassName="z-[200]"
      >
        <div className="agro-user-form-dialog__body flex max-h-[min(92dvh,720px)] flex-col overflow-hidden">
          <div className="agro-user-form-dialog__head shrink-0">
            <div className="agro-user-form-dialog__head-icon">
              <CloudSunIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <ModalTitle id="previsao-clima-title" className="agro-user-form-dialog__title">
                Previsão do tempo
              </ModalTitle>
              <ModalDescription id="previsao-clima-desc" className="agro-user-form-dialog__subtitle">
                {activeFazendaId
                  ? (location?.label ?? "Localização da fazenda")
                  : "Selecione uma fazenda para ver a previsão do tempo"}
              </ModalDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="agro-user-form-dialog__close"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <hr className="agro-user-form-dialog__rule shrink-0" />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            {fazendaOptions.length > 0 ? (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Fazenda / local</label>
                <Select
                  value={activeFazendaId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id && onSelectFazenda) void onSelectFazenda(id);
                  }}
                  disabled={geocoding}
                  placeholder={geocoding ? "Localizando…" : "Selecione uma fazenda"}
                  includeEmptyOption
                  contentClassName="z-[260]"
                >
                  {fazendaOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                      {f.localizacao ? ` · ${f.localizacao}` : ""}
                    </option>
                  ))}
                </Select>
                {geoErro ? (
                  <p className="mt-1.5 text-xs text-amber-800" role="alert">
                    {geoErro}
                  </p>
                ) : null}
              </div>
            ) : null}

            {semCoordenadas ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-amber-900">Localização indisponível</p>
                <p className="mt-1 text-xs text-amber-800/90">
                  Selecione uma fazenda com localização ou aguarde a geolocalização terminar.
                </p>
              </div>
            ) : isLoading || isFetching ? (
              <div className="space-y-3 py-4" aria-busy="true">
                <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500">Carregando previsão…</p>
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-red-800">Não foi possível carregar a previsão.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 inline-flex h-9 items-center rounded-lg bg-[var(--agro-brand)] px-4 text-sm font-semibold text-white"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {atualizadoLabel ? (
                  <p className="text-xs text-gray-500">Atualizado em {atualizadoLabel} · Open-Meteo</p>
                ) : null}

                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {data?.atual?.temperatura != null ? `${Math.round(data.atual.temperatura)}°C` : "—"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-700">{data?.atual?.condicao ?? "—"}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <StatPill
                      icon={DropletIcon}
                      label="Umidade"
                      value={data?.atual?.umidade != null ? `${Math.round(data.atual.umidade)}%` : "—"}
                    />
                    <StatPill
                      icon={WindIcon}
                      label="Vento"
                      value={data?.atual?.vento != null ? `${Math.round(data.atual.vento)} km/h` : "—"}
                    />
                    <StatPill
                      icon={CloudSunIcon}
                      label="Chuva agora"
                      value={data?.atual?.chuva != null ? `${data.atual.chuva} mm` : "0 mm"}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Próximas horas (hoje)</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(data?.proximasHoras ?? []).map((h) => (
                      <div
                        key={h.time}
                        className="min-w-[4.5rem] shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2 text-center"
                      >
                        <p className="text-[10px] font-medium text-gray-500">{h.hora}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {h.temp != null ? `${Math.round(h.temp)}°` : "—"}
                        </p>
                        <p className="mt-0.5 text-[9px] leading-tight text-gray-600 line-clamp-2">{h.condicao}</p>
                        {h.chuvaProb != null ? (
                          <p className="mt-1 text-[9px] text-sky-700">{Math.round(h.chuvaProb)}%</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Próximos 7 dias</h3>
                  <ul className="space-y-2">
                    {(data?.dias ?? []).map((dia) => (
                      <li
                        key={dia.date}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                      >
                        <div className="w-16 shrink-0">
                          <p className="text-xs font-semibold capitalize text-gray-800">{dia.label}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-gray-600">{dia.condicao}</p>
                          <p className="text-[10px] text-gray-500">
                            Chuva {dia.chuvaMm != null ? `${dia.chuvaMm.toFixed(1)} mm` : "—"}
                            {dia.chuvaProb != null ? ` · ${Math.round(dia.chuvaProb)}% prob.` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {dia.tempMax != null ? `${Math.round(dia.tempMax)}°` : "—"}
                            <span className="font-medium text-gray-500">
                              {" "}
                              / {dia.tempMin != null ? `${Math.round(dia.tempMin)}°` : "—"}
                            </span>
                          </p>
                          {dia.ventoMax != null ? (
                            <p className="text-[10px] text-gray-500">Vento {Math.round(dia.ventoMax)} km/h</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
