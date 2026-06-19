import { useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import AgroFormDialog from "../../../components/dialogs/AgroFormDialog.jsx";
import Button from "../../../components/ui/Button/Button.jsx";
import { ChevronDownIcon } from "../../../components/ui/icons.jsx";

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
];

export default function GastoUpsertModal({
  open,
  onClose,
  isEdit,
  form,
  setForm,
  onSubmit,
  colheitas,
  tipos,
  loading,
}) {
  const title = isEdit ? "Editar Gasto" : "Criar Gasto";
  const subtitle = isEdit
    ? "Atualize as informações do gasto selecionado."
    : "Registre um novo gasto para rastrear suas despesas.";
  const submitLabel = isEdit ? "Salvar alterações" : "Criar Gasto";

  const [tipoDropdownAberto, setTipoDropdownAberto] = useState(false);
  const [statusDropdownAberto, setStatusDropdownAberto] = useState(false);
  const [colheitaDropdownAberto, setColheitaDropdownAberto] = useState(false);

  const selectedColheita = useMemo(
    () => colheitas.find((c) => c.id === form.colheitaId) ?? null,
    [colheitas, form.colheitaId],
  );

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={DollarSign}
      titleId={isEdit ? "editar-gasto-title" : "criar-gasto-title"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="agro-user-form-dialog__grid">
          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-colheita">
              Colheita
            </label>
            <div className="relative">
              <button
                id="gasto-colheita"
                type="button"
                className="agro-user-form-dialog__select w-full text-left"
                onClick={() => setColheitaDropdownAberto((v) => !v)}
              >
                {form.colheitaId && selectedColheita
                  ? `${selectedColheita.fazenda?.nome ?? ""} · ${selectedColheita.cultura?.nome ?? ""} · ${selectedColheita.ano}`
                  : "Selecione uma colheita"}
              </button>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

              {colheitaDropdownAberto && (
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setColheitaDropdownAberto(false)} />
              )}
              {colheitaDropdownAberto && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {colheitas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100"
                      onClick={() => {
                        setForm((p) => ({ ...p, colheitaId: c.id }));
                        setColheitaDropdownAberto(false);
                      }}
                    >
                      {c.fazenda?.nome} · {c.cultura?.nome} · {c.ano}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-tipo">
              Tipo
            </label>
            <div className="relative">
              <button
                id="gasto-tipo"
                type="button"
                className="agro-user-form-dialog__select w-full text-left"
                onClick={() => setTipoDropdownAberto((v) => !v)}
              >
                {form.tipo || "Selecione"}
              </button>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

              {tipoDropdownAberto && (
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setTipoDropdownAberto(false)} />
              )}
              {tipoDropdownAberto && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {tipos.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100"
                      onClick={() => {
                        setForm((p) => ({ ...p, tipo: t }));
                        setTipoDropdownAberto(false);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-valor">
              Valor
            </label>
            <input
              id="gasto-valor"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.valor}
              onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
              className="agro-user-form-dialog__input"
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-data">
              Data
            </label>
            <input
              id="gasto-data"
              type="date"
              value={form.data}
              onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
              className="agro-user-form-dialog__input"
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-vencimento">
              Vencimento
            </label>
            <input
              id="gasto-vencimento"
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm((p) => ({ ...p, dataVencimento: e.target.value }))}
              className="agro-user-form-dialog__input"
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-1">
            <label className="agro-user-form-dialog__label" htmlFor="gasto-status">
              Status
            </label>
            <div className="relative">
              <button
                id="gasto-status"
                type="button"
                className="agro-user-form-dialog__select w-full text-left"
                onClick={() => setStatusDropdownAberto((v) => !v)}
              >
                {STATUS_OPTIONS.find((s) => s.value === form.status)?.label || "Selecione"}
              </button>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

              {statusDropdownAberto && (
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusDropdownAberto(false)} />
              )}
              {statusDropdownAberto && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100"
                      onClick={() => {
                        setForm((p) => ({ ...p, status: s.value }));
                        setStatusDropdownAberto(false);
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {form.tipo?.toLowerCase?.() === "outro" && (
            <div className="agro-user-form-dialog__field md:col-span-2">
              <label className="agro-user-form-dialog__label" htmlFor="gasto-tipo-custom">
                Tipo (personalizado)
              </label>
              <input
                id="gasto-tipo-custom"
                type="text"
                value={form.tipoPersonalizado}
                onChange={(e) => setForm((p) => ({ ...p, tipoPersonalizado: e.target.value }))}
                className="agro-user-form-dialog__input"
              />
            </div>
          )}
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button
            type="button"
            variant="danger"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Salvando…" : submitLabel}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}


