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
    arrendamentoCulturaId: "",
    arrendamentoQuantidadeSacas: "",
    arrendamentoPeriodicidade: "MENSAL",
    arrendamentoDataInicio: new Date().toISOString().slice(0, 10),
  };
}

export function mapArrendamentoFromFazenda(fazenda) {
  if (!fazenda?.arrendamento) {
    return emptyArrendamentoForm();
  }
  return {
    arrendamentoCulturaId: fazenda.arrendamento.culturaId ?? "",
    arrendamentoQuantidadeSacas: String(fazenda.arrendamento.quantidadeSacas ?? ""),
    arrendamentoPeriodicidade: fazenda.arrendamento.periodicidade ?? "MENSAL",
    arrendamentoDataInicio: fazenda.arrendamento.dataInicio ?? new Date().toISOString().slice(0, 10),
  };
}

export function buildArrendamentoPayload(form) {
  const quantidade = Number(String(form.arrendamentoQuantidadeSacas ?? "").replace(",", "."));
  return {
    arrendamentoCulturaId: form.arrendamentoCulturaId,
    arrendamentoQuantidadeSacas: quantidade,
    arrendamentoPeriodicidade: form.arrendamentoPeriodicidade,
    arrendamentoDataInicio: form.arrendamentoDataInicio,
  };
}

export function validateArrendamentoForm(form) {
  if (!form.arrendamentoCulturaId) {
    return "Selecione a cultura recebida no arrendamento.";
  }
  const quantidade = Number(String(form.arrendamentoQuantidadeSacas ?? "").replace(",", "."));
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return "Informe a quantidade de sacas recebidas por período.";
  }
  if (!form.arrendamentoPeriodicidade) {
    return "Selecione a periodicidade do recebimento.";
  }
  if (!form.arrendamentoDataInicio) {
    return "Informe a data do primeiro recebimento.";
  }
  return null;
}

export default function FazendaArrendamentoFields({ form, setForm, culturas = [], onFieldChange }) {
  const touch = () => {
    if (typeof onFieldChange === "function") onFieldChange();
  };

  return (
    <div className="col-span-full mt-1 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
      <p className="text-sm font-semibold text-sky-900">Entrega de arrendamento</p>
      <p className="mt-1 text-xs leading-relaxed text-sky-800/90">
        Fazenda alugada para terceiros: informe quantas sacas de qual cultura você recebe e com que
        frequência. As entregas aparecem na tela de Estoque para baixa das sacas do inventário.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="agro-user-form-dialog__field">
          <label className="agro-user-form-dialog__label" htmlFor="arrendamento-cultura">
            Cultura recebida
          </label>
          <Select
            id="arrendamento-cultura"
            className={FIELD_SELECT}
            value={form.arrendamentoCulturaId}
            onChange={(e) => {
              touch();
              setForm((p) => ({ ...p, arrendamentoCulturaId: e.target.value }));
            }}
          >
            <option value="">Selecione a cultura</option>
            {culturas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="agro-user-form-dialog__field">
          <label className="agro-user-form-dialog__label" htmlFor="arrendamento-quantidade">
            Quantidade de sacas por período
          </label>
          <input
            id="arrendamento-quantidade"
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 500"
            value={form.arrendamentoQuantidadeSacas}
            onChange={(e) => {
              touch();
              const v = e.target.value.replace(/[^\d.,]/g, "");
              setForm((p) => ({ ...p, arrendamentoQuantidadeSacas: v }));
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
