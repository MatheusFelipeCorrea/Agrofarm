import Select from "../ui/Select/Select.jsx";
import DatePickerInput from "../ui/DatePickerInput.jsx";

const FIELD_INPUT = "agro-user-form-dialog__input";
const FIELD_SELECT = "agro-user-form-dialog__select";

const PERIODICIDADE_OPTIONS = [
  { value: "MENSAL", label: "Mensal" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
];

export function emptyArrendamentoForm() {
  return {
    arrendamentoValor: "",
    arrendamentoPeriodicidade: "MENSAL",
    arrendamentoDataInicio: new Date().toISOString().slice(0, 10),
  };
}

export function mapArrendamentoFromFazenda(fazenda) {
  if (!fazenda?.arrendamento) {
    return emptyArrendamentoForm();
  }
  return {
    arrendamentoValor: String(fazenda.arrendamento.valor ?? ""),
    arrendamentoPeriodicidade: fazenda.arrendamento.periodicidade ?? "MENSAL",
    arrendamentoDataInicio: fazenda.arrendamento.dataInicio ?? new Date().toISOString().slice(0, 10),
  };
}

export function buildArrendamentoPayload(form) {
  const valor = Number(String(form.arrendamentoValor ?? "").replace(",", "."));
  return {
    arrendamentoValor: valor,
    arrendamentoPeriodicidade: form.arrendamentoPeriodicidade,
    arrendamentoDataInicio: form.arrendamentoDataInicio,
  };
}

export function validateArrendamentoForm(form) {
  const valor = Number(String(form.arrendamentoValor ?? "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return "Informe o valor recebido no arrendamento.";
  }
  if (!form.arrendamentoPeriodicidade) {
    return "Selecione a periodicidade do recebimento.";
  }
  if (!form.arrendamentoDataInicio) {
    return "Informe a data do primeiro recebimento.";
  }
  return null;
}

export default function FazendaArrendamentoFields({ form, setForm, onFieldChange }) {
  const touch = () => {
    if (typeof onFieldChange === "function") onFieldChange();
  };

  return (
    <div className="col-span-full mt-1 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
      <p className="text-sm font-semibold text-sky-900">Receita de arrendamento</p>
      <p className="mt-1 text-xs leading-relaxed text-sky-800/90">
        Fazenda alugada para terceiros: informe quanto você recebe e com que frequência. Os recebimentos
        aparecem automaticamente na tela de Lucros, vinculados a esta fazenda.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="agro-user-form-dialog__field sm:col-span-2">
          <label className="agro-user-form-dialog__label" htmlFor="arrendamento-valor">
            Valor recebido (R$)
          </label>
          <input
            id="arrendamento-valor"
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 15000"
            value={form.arrendamentoValor}
            onChange={(e) => {
              touch();
              const v = e.target.value.replace(/[^\d.,]/g, "");
              setForm((p) => ({ ...p, arrendamentoValor: v }));
            }}
            className={`usuario-form-modal-input ${FIELD_INPUT}`}
          />
        </div>

        <div className="agro-user-form-dialog__field">
          <label className="agro-user-form-dialog__label" htmlFor="arrendamento-periodicidade">
            Periodicidade
          </label>
          <Select
            id="arrendamento-periodicidade"
            className={FIELD_SELECT}
            value={form.arrendamentoPeriodicidade}
            includeEmptyOption={false}
            onChange={(e) => {
              touch();
              setForm((p) => ({ ...p, arrendamentoPeriodicidade: e.target.value }));
            }}
          >
            {PERIODICIDADE_OPTIONS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="agro-user-form-dialog__field">
          <label className="agro-user-form-dialog__label" htmlFor="arrendamento-data-inicio">
            Data do primeiro recebimento
          </label>
          <DatePickerInput
            id="arrendamento-data-inicio"
            value={form.arrendamentoDataInicio}
            onChange={(data) => {
              touch();
              setForm((p) => ({ ...p, arrendamentoDataInicio: data }));
            }}
            className={`usuario-form-modal-input ${FIELD_INPUT} w-full`}
          />
        </div>
      </div>
    </div>
  );
}
