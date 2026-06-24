import { useMemo, useState } from "react";
import Select from "../ui/Select/Select.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import Button from "../ui/Button/Button.jsx";
import CulturaIcon from "../cultura/CulturaIcon.jsx";
import { formatDate, formatNumberPtBR } from "../../utils/formatters.js";

function colheitaOptionLabel(item) {
  const cultura = item.cultura?.nome ?? "Cultura";
  const fazenda = item.fazenda?.nome ?? "";
  return `${item.lote ?? cultura} — ${fazenda} (${formatNumberPtBR(item.emEstoque)} sacas)`;
}

export default function EstoqueArrendamentoPanel({
  entregas = [],
  lotesEstoque = [],
  isAdmin = false,
  busyId = null,
  onConfirmar,
  onMarcarNaoEntregue,
}) {
  const [modalEntrega, setModalEntrega] = useState(null);
  const [colheitaId, setColheitaId] = useState("");

  const lotesPorCultura = useMemo(() => {
    const map = new Map();
    lotesEstoque.forEach((lote) => {
      const culturaId = lote.cultura?.id;
      if (!culturaId || Number(lote.emEstoque ?? 0) <= 0) return;
      if (!map.has(culturaId)) map.set(culturaId, []);
      map.get(culturaId).push(lote);
    });
    return map;
  }, [lotesEstoque]);

  if (!isAdmin || entregas.length === 0) return null;

  const lotesDisponiveis = modalEntrega
    ? (lotesPorCultura.get(modalEntrega.cultura?.id) ?? []).filter(
        (l) => Number(l.emEstoque ?? 0) >= Number(modalEntrega.quantidadeSacas ?? 0),
      )
    : [];

  async function handleConfirmar(e) {
    e.preventDefault();
    if (!modalEntrega || !colheitaId) return;
    await onConfirmar?.({ entregaId: modalEntrega.id, colheitaId });
    setModalEntrega(null);
    setColheitaId("");
  }

  return (
    <>
      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-amber-950">Entregas de arrendamento pendentes</h2>
          <p className="mt-1 text-sm text-amber-900/80">
            Confirme a saída das sacas do estoque quando a entrega for realizada. Selecione o lote de origem.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200/80 text-left text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                <th className="px-3 py-2">Fazenda arrendada</th>
                <th className="px-3 py-2">Cultura</th>
                <th className="px-3 py-2">Sacas</th>
                <th className="px-3 py-2">Data prevista</th>
                <th className="px-3 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map((entrega) => {
                const busy = busyId === entrega.id;
                return (
                  <tr
                    key={entrega.id}
                    className={
                      entrega.vencida
                        ? "border-b border-amber-100 bg-amber-100/40"
                        : "border-b border-amber-100/80"
                    }
                  >
                    <td className="px-3 py-3 font-medium text-gray-900">{entrega.fazenda?.nome ?? "—"}</td>
                    <td className="px-3 py-3">
                      {entrega.cultura ? (
                        <span className="inline-flex items-center gap-2">
                          <CulturaIcon cultura={entrega.cultura} size="sm" />
                          {entrega.cultura.nome}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-gray-800">
                      {formatNumberPtBR(entrega.quantidadeSacas)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700">{formatDate(entrega.data)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setModalEntrega(entrega);
                            setColheitaId("");
                          }}
                          className="inline-flex h-8 items-center rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-40"
                        >
                          {busy ? "…" : "Confirmar saída"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onMarcarNaoEntregue?.(entrega.id)}
                          className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40"
                        >
                          Não entregue
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AgroFormDialog
        open={Boolean(modalEntrega)}
        onClose={() => {
          setModalEntrega(null);
          setColheitaId("");
        }}
        title="Confirmar saída do estoque"
        subtitle="Selecione o lote de colheita de onde as sacas serão debitadas."
      >
        <form onSubmit={handleConfirmar} className="space-y-4">
          {modalEntrega ? (
            <p className="text-sm text-gray-600">
              Debitar <strong>{formatNumberPtBR(modalEntrega.quantidadeSacas)} sacas</strong> de{" "}
              <strong>{modalEntrega.cultura?.nome}</strong> referentes à{" "}
              <strong>{modalEntrega.fazenda?.nome}</strong>.
            </p>
          ) : null}

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="arrendamento-colheita">
              Lote de origem
            </label>
            <Select
              id="arrendamento-colheita"
              value={colheitaId}
              onChange={(e) => setColheitaId(e.target.value)}
              className="agro-user-form-dialog__select"
            >
              <option value="">Selecione o lote</option>
              {lotesDisponiveis.map((lote) => (
                <option key={lote.colheitaId} value={lote.colheitaId}>
                  {colheitaOptionLabel(lote)}
                </option>
              ))}
            </Select>
            {modalEntrega && lotesDisponiveis.length === 0 ? (
              <p className="mt-2 text-xs text-red-600">
                Não há lotes com saldo suficiente desta cultura no estoque.
              </p>
            ) : null}
          </div>

          <div className="agro-user-form-dialog__footer">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setModalEntrega(null);
                setColheitaId("");
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!colheitaId || busyId === modalEntrega?.id}>
              Confirmar
            </Button>
          </div>
        </form>
      </AgroFormDialog>
    </>
  );
}
