import { CulturaPill } from "../../pages/Fazendas/fazendaListUi.jsx";
import { HistoricoMapaStatusBadge } from "../ui/badges/DomainBadges.jsx";

export const HISTORICO_STATUS_AJUDA = {
  COLHIDA:
    "Havia colheita registrada para a cultura do talhão — ciclo agrícola concluído antes de remover do mapa.",
  ENCERRADA:
    "Talhão com cultura no mapa, sem colheita vinculada — encerrado ao sair do mapa.",
  ARQUIVADA: "Removido do mapa sem cultura ou sem colheita associada — só arquivado para consulta.",
};

function formatHa(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("pt-BR");
}

function Thumbnail({ cor }) {
  const hex = cor || "#16a34a";
  return (
    <div
      className="h-24 w-full max-w-[10rem] rounded-lg ring-1 ring-inset ring-black/10"
      style={{
        background: `linear-gradient(135deg, ${hex}33 0%, ${hex}88 50%, ${hex}44 100%)`,
      }}
      aria-hidden
    />
  );
}

const TIMELINE_STEPS = [
  { key: "plantada", label: "Plantada no mapa principal" },
  { key: "colhida", label: "Colhida" },
  { key: "historico", label: "Movida para o histórico" },
];

/** Três etapas do que o sistema registra ao arquivar (novo plantio = ação manual via Restaurar). */
export function resolveHistoricoTimelineSteps(item) {
  if (!item) return [];
  const colhidaFeita = item.status === "COLHIDA" || Boolean(item.dataColheita);
  return [
    { ...TIMELINE_STEPS[0], done: true },
    { ...TIMELINE_STEPS[1], done: colhidaFeita, skipped: !colhidaFeita },
    { ...TIMELINE_STEPS[2], done: true, current: true },
  ];
}

export function HistoricoMapaTimeline({ item }) {
  const steps = resolveHistoricoTimelineSteps(item);

  return (
    <ol className="mt-3 space-y-0">
      {steps.map((step, idx) => {
        const done = step.done;
        const skipped = step.skipped;
        const current = step.current;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  skipped
                    ? "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
                    : done
                      ? current
                        ? "bg-white text-[var(--agro-brand)] ring-2 ring-[var(--agro-brand)]"
                        : "bg-[var(--agro-brand)] text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {skipped ? "—" : idx + 1}
              </span>
              {idx < steps.length - 1 ? (
                <span
                  className={`my-0.5 w-0.5 flex-1 min-h-[1.25rem] ${
                    done && !skipped ? "bg-[var(--agro-brand)]" : "bg-gray-200"
                  }`}
                />
              ) : null}
            </div>
            <div className="pb-4">
              <p
                className={`text-sm ${
                  skipped ? "text-gray-400" : done ? "font-medium text-gray-900" : "text-gray-500"
                }`}
              >
                {step.label}
              </p>
              {skipped ? (
                <p className="text-xs text-gray-400">Não aplicável (área encerrada sem colheita registrada)</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function HistoricoMapaDetalheBody({ item }) {
  if (!item) return null;

  const titulo = item.safra ? `${item.nome} — ${item.safra}` : item.nome;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <Thumbnail cor={item.culturaCor} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-gray-900">{titulo}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.culturaNome ? <CulturaPill nome={item.culturaNome} cor={item.culturaCor} /> : null}
            <HistoricoMapaStatusBadge status={item.status} />
          </div>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        {[
          ["Talhão", item.nome],
          ["Cultura", item.culturaNome ?? "—"],
          ["Safra", item.safra ?? "—"],
          ["Área", `${formatHa(item.areaHectares)} ha`],
          ["Plantio", formatDate(item.dataPlantio)],
          ["Colheita", formatDate(item.dataColheita)],
          [
            "Produtividade",
            item.produtividadeScHa != null ? `${item.produtividadeScHa} sc/ha` : "—",
          ],
          ["Arquivado em", formatDate(item.arquivadoEm)],
        ].map(([label, valor]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-gray-50 pb-2 last:border-0">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right font-medium text-gray-900">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
        {HISTORICO_STATUS_AJUDA[item.status] ?? HISTORICO_STATUS_AJUDA.ARQUIVADA}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900">Linha do tempo do ciclo</h3>
        <p className="mt-1 text-xs text-gray-500">
          Registro do que aconteceu até o talhão sair do mapa. Para plantar de novo, use Restaurar no mapa.
        </p>
        <HistoricoMapaTimeline item={item} />
      </div>
    </div>
  );
}
