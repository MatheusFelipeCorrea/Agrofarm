import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button/Button.jsx";
import Select from "../ui/Select/Select.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import { LeafIcon, MapIcon } from "../ui/icons.jsx";
import CulturaIcon from "../cultura/CulturaIcon.jsx";
import { usePoligonosQuery } from "../../queries/poligono/usePoligonoQueries.js";
import {
  contarTalhoesPorCultura,
  isCulturaCafe,
  somarHectaresTalhoes,
  statusPadraoParaCultura,
  statusPermitidosParaCultura,
  statusValidoParaCultura,
} from "../../utils/culturaStatus.js";

const FIELD_SELECT = "agro-user-form-dialog__select";

function formatHa(value) {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;
}

export default function FazendaCulturaVinculoModal({
  open,
  mode = "create",
  fazendaId,
  culturas = [],
  vinculo = null,
  culturaInicial = "",
  loading = false,
  onClose,
  onSubmit,
  onIrParaMapa,
}) {
  const isEdit = mode === "edit";
  const [culturaId, setCulturaId] = useState("");
  const [status, setStatus] = useState("PLANTIO");
  const [localError, setLocalError] = useState("");

  const { data: poligonos = [], isLoading: poligonosCarregando } = usePoligonosQuery(fazendaId, {
    enabled: open && Boolean(fazendaId),
  });

  const culturasOrdenadas = useMemo(
    () => [...culturas].sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt", { sensitivity: "base" })),
    [culturas],
  );

  const culturaSelecionada = useMemo(
    () => culturasOrdenadas.find((c) => c.id === culturaId) ?? vinculo?.cultura ?? null,
    [culturasOrdenadas, culturaId, vinculo],
  );

  const hectaresTalhao = useMemo(
    () => somarHectaresTalhoes(poligonos, culturaId || vinculo?.culturaId),
    [poligonos, culturaId, vinculo],
  );

  const qtdTalhoes = useMemo(
    () => contarTalhoesPorCultura(poligonos, culturaId || vinculo?.culturaId),
    [poligonos, culturaId, vinculo],
  );

  const statusOptions = useMemo(
    () => statusPermitidosParaCultura(culturaSelecionada?.nome),
    [culturaSelecionada?.nome],
  );

  useEffect(() => {
    if (!open) return;

    if (isEdit && vinculo) {
      const id = vinculo.culturaId ?? vinculo.cultura?.id ?? "";
      const nome = vinculo.cultura?.nome;
      const st = vinculo.status ?? statusPadraoParaCultura(nome);
      setCulturaId(id);
      setStatus(statusValidoParaCultura(nome, st) ? st : statusPadraoParaCultura(nome));
    } else {
      setCulturaId(culturaInicial || "");
      setStatus("PLANTIO");
    }
    setLocalError("");
  }, [open, isEdit, vinculo, culturaInicial]);

  useEffect(() => {
    if (!culturaSelecionada?.nome) return;
    if (!statusValidoParaCultura(culturaSelecionada.nome, status)) {
      setStatus(statusPadraoParaCultura(culturaSelecionada.nome));
    }
  }, [culturaSelecionada?.nome, status]);

  function handleCulturaChange(nextId) {
    setCulturaId(nextId);
    const cultura = culturasOrdenadas.find((c) => c.id === nextId);
    if (cultura) {
      setStatus(statusPadraoParaCultura(cultura.nome));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    if (!isEdit && !culturaId) {
      setLocalError("Selecione uma cultura.");
      return;
    }

    if (poligonosCarregando) {
      setLocalError("Aguarde o carregamento dos talhões do mapa.");
      return;
    }

    if (hectaresTalhao <= 0) {
      setLocalError("Cadastre ao menos um talhão desta cultura no mapa antes de vincular.");
      return;
    }

    if (!statusValidoParaCultura(culturaSelecionada?.nome, status)) {
      setLocalError("Secagem está disponível apenas para culturas de café.");
      return;
    }

    try {
      await onSubmit({ culturaId: culturaId || vinculo?.culturaId, status });
      onClose();
    } catch {
      /* Erro da API: toast via React Query. */
    }
  }

  const podeSalvar = !poligonosCarregando && hectaresTalhao > 0 && (isEdit || Boolean(culturaId));
  const retornouDoMapa = !isEdit && culturaInicial && culturaId === culturaInicial && qtdTalhoes > 0;

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar cultura na fazenda" : "Vincular cultura à fazenda"}
      subtitle={
        isEdit
          ? "Atualize o status operacional. Os hectares vêm automaticamente dos talhões no mapa."
          : "Selecione a cultura e o status. A área em hectares é calculada pelos talhões cadastrados no mapa."
      }
      icon={LeafIcon}
      titleId={isEdit ? "editar-cultura-vinculo-title" : "adicionar-cultura-vinculo-title"}
      errorMessage={localError}
    >
      <form onSubmit={handleSubmit}>
        {retornouDoMapa ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
              <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Talhões encontrados!</p>
              <p className="mt-0.5 text-xs text-green-700">
                {qtdTalhoes} talhão{qtdTalhoes === 1 ? "" : "ões"} de <strong>{culturaSelecionada?.nome}</strong>{" "}
                {qtdTalhoes === 1 ? "foi mapeado" : "foram mapeados"} ({formatHa(hectaresTalhao)}). Confirme o
                status e clique em <strong>Vincular cultura</strong>.
              </p>
            </div>
          </div>
        ) : null}
        <div className="agro-user-form-dialog__grid">
          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="vinculo-cultura-id">
              Cultura
            </label>
            {isEdit && culturaSelecionada ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <CulturaIcon cultura={culturaSelecionada} size="md" />
                <span className="font-medium text-gray-900">{culturaSelecionada.nome}</span>
              </div>
            ) : (
              <Select
                id="vinculo-cultura-id"
                className={FIELD_SELECT}
                value={culturaId}
                onChange={(e) => handleCulturaChange(e.target.value)}
                required
              >
                <option value="">Selecione a cultura</option>
                {culturasOrdenadas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {isCulturaCafe(c.nome) ? " (café)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <span className="agro-user-form-dialog__label">Hectares (talhões no mapa)</span>
            {poligonosCarregando ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-sm text-gray-500">Carregando talhões…</p>
              </div>
            ) : !isEdit && culturaId && qtdTalhoes === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <MapIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                      Nenhum talhão mapeado para esta cultura
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Para vincular <strong>{culturaSelecionada?.nome}</strong>, primeiro desenhe a área dela
                      no mapa desta fazenda.
                    </p>
                    {onIrParaMapa ? (
                      <button
                        type="button"
                        onClick={() => onIrParaMapa(culturaId)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        <MapIcon className="h-3.5 w-3.5" />
                        Ir para o Mapa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-lg font-semibold tabular-nums text-gray-900">{formatHa(hectaresTalhao)}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {qtdTalhoes > 0
                    ? `${qtdTalhoes} talhão${qtdTalhoes === 1 ? "" : "ões"} vinculado${qtdTalhoes === 1 ? "" : "s"}`
                    : "Selecione uma cultura para ver os talhões."}
                </p>
              </div>
            )}
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="vinculo-status">
              Status
            </label>
            <Select
              id="vinculo-status"
              className={FIELD_SELECT}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!culturaSelecionada}
            >
              {statusOptions.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
            {!isCulturaCafe(culturaSelecionada?.nome) && culturaSelecionada ? (
              <p className="mt-1 text-xs text-gray-500">Secagem aparece apenas para culturas de café.</p>
            ) : null}
          </div>
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={loading || !podeSalvar}
            aria-busy={loading}
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Vincular cultura"}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}
