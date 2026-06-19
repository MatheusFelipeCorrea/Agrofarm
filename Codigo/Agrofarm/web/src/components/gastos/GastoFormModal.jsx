import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Tags } from "lucide-react";
import { PencilIcon, TrashIcon } from "../ui/icons.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import Button from "../ui/Button/Button.jsx";
import Select from "../ui/Select/Select.jsx";
import DatePickerInput from "../ui/DatePickerInput.jsx";
import TimePickerInput from "../ui/TimePickerInput.jsx";
import { useCulturasDaFazendaQuery } from "../../queries/fazenda/useFazendaQueries.js";

const STATUS_OPTIONS = [
  { value: "PAGO", label: "Pago" },
  { value: "PENDENTE", label: "Pendente" },
];

const RECORRENCIAS = [
  { value: "NENHUMA", label: "Sem recorrência" },
  { value: "SEMANAL", label: "1 vez por semana" },
  { value: "MENSAL", label: "1 vez por mês" },
  { value: "TRIMESTRAL", label: "1 vez a cada 3 meses" },
  { value: "ANUAL", label: "1 vez por ano" },
  { value: "OUTROS", label: "Outros" },
];

export default function GastoFormModal({
  open,
  mode,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
  role,
  fazendas,
  culturas,
  colheitas,
  tiposPadrao,
  tiposCustom,
  onAddTipo,
  onUpdateTipo,
  onDeleteTipo,
}) {
  const [localError, setLocalError] = useState("");
  const [gerenciarTiposOpen, setGerenciarTiposOpen] = useState(false);
  const [novoTipo, setNovoTipo] = useState("");
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [criarLembrete, setCriarLembrete] = useState(false);
  const [lembrete, setLembrete] = useState({
    titulo: "",
    descricao: "",
    data: "",
    hora: "08:00",
    telefoneWhatsapp: "",
    recorrencia: "NENHUMA",
    recorrenciaCustom: "",
  });

  const isEdit = mode === "edit";
  const isFuncionario = role === "FUNCIONARIO";

  const fazendasPermitidas = fazendas ?? [];

  const mostrarCampoFazenda = role === "ADMIN" || fazendasPermitidas.length > 1;

  useEffect(() => {
    if (!open) return;
    if (!isFuncionario) return;
    if (fazendasPermitidas.length === 1 && !form.fazendaId) {
      setForm((prev) => ({ ...prev, fazendaId: fazendasPermitidas[0].id }));
    }
  }, [open, isFuncionario, fazendasPermitidas, form.fazendaId, setForm]);

  const { data: vinculosDaFazenda = [] } = useCulturasDaFazendaQuery(form.fazendaId, {
    enabled: open && Boolean(form.fazendaId),
  });

  const culturasFiltradas = useMemo(() => {
    if (!form.fazendaId) return culturas ?? [];
    if (!vinculosDaFazenda.length) return culturas ?? [];

    const idsVinculados = new Set(vinculosDaFazenda.map((v) => v.culturaId ?? v.cultura?.id));
    return (culturas ?? []).filter((c) => idsVinculados.has(c.id));
  }, [form.fazendaId, culturas, vinculosDaFazenda]);

  useEffect(() => {
    if (!open || !form.culturaId || !form.fazendaId) return;
    const valida = culturasFiltradas.some((c) => c.id === form.culturaId);
    if (!valida) setForm((prev) => ({ ...prev, culturaId: "", colheitaId: "" }));
  }, [open, form.fazendaId, form.culturaId, culturasFiltradas, setForm]);

  const colheitasCompativeis = useMemo(() => {
    return (colheitas ?? [])
      .filter((c) => (!form.fazendaId || c.fazendaId === form.fazendaId) && (!form.culturaId || c.culturaId === form.culturaId))
      .sort((a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0));
  }, [colheitas, form.fazendaId, form.culturaId]);

  useEffect(() => {
    if (!open) return;
    if (!colheitasCompativeis.length) {
      if (form.colheitaId) setForm((prev) => ({ ...prev, colheitaId: "" }));
      return;
    }

    const existe = colheitasCompativeis.some((c) => c.id === form.colheitaId);
    if (!existe) {
      setForm((prev) => ({ ...prev, colheitaId: colheitasCompativeis[0].id }));
    }
  }, [open, colheitasCompativeis, form.colheitaId, setForm]);

  const tipos = tiposPadrao;

  const title = isEdit ? "Editar gasto" : "Novo gasto";
  const subtitle = isEdit
    ? "Atualize as informacoes do gasto selecionado."
    : "Cadastre um novo gasto para acompanhar os custos da fazenda.";

  useEffect(() => {
    if (!open) return;

    const tipoLabel = form.tipo === "OUTRO" ? form.tipoPersonalizado : form.tipo;

    setLocalError("");
    setCriarLembrete(false);
    setLembrete({
      titulo: tipoLabel ? `Lembrar gasto: ${tipoLabel}` : "",
      descricao: form.descricao || "",
      data: "",
      hora: "",
      telefoneWhatsapp: "",
      recorrencia: "NENHUMA",
      recorrenciaCustom: "",
    });
  }, [open, form.data, form.dataVencimento, form.descricao, form.tipo, form.tipoPersonalizado]);

  const salvarTipo = () => {
    const nome = novoTipo.trim();
    if (!nome) return;

    if (editandoTipo) {
      onUpdateTipo(editandoTipo, nome);
      setEditandoTipo(null);
    } else {
      onAddTipo(nome);
    }

    setNovoTipo("");
  };

  return (
    <>
      <AgroFormDialog
        open={open && !gerenciarTiposOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        icon={ReceiptText}
        titleId={isEdit ? "editar-gasto-title" : "novo-gasto-title"}
        errorMessage={localError}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();

            if (criarLembrete) {
              const titulo = lembrete.titulo.trim();
              if (titulo.length < 3) {
                setLocalError("Titulo do lembrete deve ter ao menos 3 caracteres.");
                return;
              }

              if (!lembrete.data || !lembrete.hora) {
                setLocalError("Preencha data e hora do lembrete.");
                return;
              }

              if (lembrete.recorrencia === "OUTROS" && !lembrete.recorrenciaCustom.trim()) {
                setLocalError("Informe a recorrência personalizada do lembrete.");
                return;
              }
            }

            setLocalError("");
            onSubmit({
              criarLembrete,
              lembrete: criarLembrete
                ? {
                    titulo: lembrete.titulo.trim(),
                    descricao: lembrete.descricao?.trim() || "",
                    data: lembrete.data,
                    hora: lembrete.hora,
                    telefoneWhatsapp: lembrete.telefoneWhatsapp?.trim() || "",
                    recorrencia: lembrete.recorrencia,
                    recorrenciaCustom: lembrete.recorrencia === "OUTROS" ? lembrete.recorrenciaCustom?.trim() || "" : "",
                  }
                : null,
            });
          }}
        >
          <div className="agro-user-form-dialog__grid">
            {mostrarCampoFazenda ? (
              <div className="agro-user-form-dialog__field">
                <label className="agro-user-form-dialog__label" htmlFor="gasto-fazenda">Fazenda</label>
                <Select
                  value={form.fazendaId}
                  onChange={(e) => setForm((p) => ({ ...p, fazendaId: e.target.value, culturaId: "", colheitaId: "" }))}
                  placeholder="Selecione a fazenda"
                >
                  {fazendasPermitidas.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="agro-user-form-dialog__field">
                <label className="agro-user-form-dialog__label">Fazenda</label>
                <input
                  value={fazendasPermitidas[0]?.nome ?? ""}
                  readOnly
                  className="agro-user-form-dialog__input bg-gray-50"
                />
              </div>
            )}

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label" htmlFor="gasto-cultura">Cultura</label>
              <Select
                value={form.culturaId}
                onChange={(e) => setForm((p) => ({ ...p, culturaId: e.target.value, colheitaId: "" }))}
                placeholder="Selecione a cultura"
              >
                {culturasFiltradas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>

            <div className="agro-user-form-dialog__field md:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label className="agro-user-form-dialog__label mb-0" htmlFor="gasto-tipo">
                  Tipo de gasto
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f7b4e] transition-colors hover:text-[#1f4f38] hover:underline"
                  onClick={() => setGerenciarTiposOpen(true)}
                >
                  <Tags className="h-4 w-4 shrink-0" aria-hidden />
                  Gerenciar tipos personalizados
                </button>
              </div>
              <Select
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                placeholder="Selecione o tipo de gasto"
                wrapperClassName="relative w-full"
              >
                {tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
                <option value="OUTRO">Outro</option>
              </Select>
            </div>

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label" htmlFor="gasto-valor">Valor</label>
              <input
                id="gasto-valor"
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                className="agro-user-form-dialog__input"
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label">Data do gasto</label>
              <DatePickerInput
                value={form.data}
                onChange={(v) => setForm((p) => ({ ...p, data: v }))}
                placeholder="Selecione a data"
              />
            </div>

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label">Data de vencimento</label>
              <DatePickerInput
                value={form.dataVencimento}
                onChange={(v) => setForm((p) => ({ ...p, dataVencimento: v }))}
                placeholder="Selecione o vencimento"
              />
            </div>

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label" htmlFor="gasto-status">Status do pagamento</label>
              <Select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                includeEmptyOption={false}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>

            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label" htmlFor="gasto-obs">Observacao (opcional)</label>
              <textarea
                id="gasto-obs"
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                className="agro-user-form-dialog__input min-h-[4.5rem] resize-none py-2"
                placeholder="Digite uma observacao (opcional)"
              />
            </div>

            {form.tipo === "OUTRO" ? (
              <div className="agro-user-form-dialog__field md:col-span-2">
                <label className="agro-user-form-dialog__label" htmlFor="gasto-tipo-personalizado">Tipo personalizado</label>
                <input
                  id="gasto-tipo-personalizado"
                  value={form.tipoPersonalizado}
                  onChange={(e) => setForm((p) => ({ ...p, tipoPersonalizado: e.target.value }))}
                  className="agro-user-form-dialog__input"
                  placeholder="Informe o tipo de gasto"
                  required
                />
              </div>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="mt-4 rounded-xl border border-[#d8e9de] bg-[#f5fbf7] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f4f38]">Lembrete deste gasto</p>
                  <p className="mt-0.5 text-xs text-[#4b6a5b]">Se ativado, cria um lembrete automaticamente ao salvar o gasto.</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={criarLembrete}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${criarLembrete ? "bg-[#0f7f3b]" : "bg-gray-300"}`}
                  onClick={() => setCriarLembrete((prev) => !prev)}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${criarLembrete ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {criarLembrete ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-titulo">Titulo do lembrete</label>
                    <input
                      id="gasto-lembrete-titulo"
                      className="agro-user-form-dialog__input"
                      value={lembrete.titulo}
                      onChange={(e) => setLembrete((prev) => ({ ...prev, titulo: e.target.value }))}
                      maxLength={120}
                      placeholder="Ex.: Pagar este gasto"
                    />
                  </div>

                  <div>
                    <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-data">Data do lembrete</label>
                    <DatePickerInput
                      value={lembrete.data}
                      onChange={(value) => setLembrete((prev) => ({ ...prev, data: value }))}
                      placeholder="Selecione a data"
                    />
                  </div>

                  <div>
                    <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-hora">Hora do lembrete</label>
                    <TimePickerInput
                      id="gasto-lembrete-hora"
                      value={lembrete.hora}
                      onChange={(value) => setLembrete((prev) => ({ ...prev, hora: value }))}
                      placeholder="Selecione a hora"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-telefone">WhatsApp (opcional)</label>
                    <input
                      id="gasto-lembrete-telefone"
                      className="agro-user-form-dialog__input"
                      value={lembrete.telefoneWhatsapp}
                      onChange={(e) => setLembrete((prev) => ({ ...prev, telefoneWhatsapp: e.target.value }))}
                      placeholder="(31) 99999-9999"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-recorrencia">Recorrência</label>
                    <Select
                      value={lembrete.recorrencia}
                      onChange={(e) =>
                        setLembrete((prev) => ({
                          ...prev,
                          recorrencia: e.target.value,
                          recorrenciaCustom: e.target.value === "OUTROS" ? prev.recorrenciaCustom : "",
                        }))
                      }
                      placeholder="Selecione a recorrência"
                    >
                      {RECORRENCIAS.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </Select>
                  </div>

                  {lembrete.recorrencia === "OUTROS" ? (
                    <div>
                      <label className="agro-user-form-dialog__label" htmlFor="gasto-lembrete-recorrencia-custom">Recorrência personalizada</label>
                      <input
                        id="gasto-lembrete-recorrencia-custom"
                        className="agro-user-form-dialog__input"
                        value={lembrete.recorrenciaCustom}
                        onChange={(e) => setLembrete((prev) => ({ ...prev, recorrenciaCustom: e.target.value }))}
                        placeholder="Ex.: A cada 10 dias"
                        maxLength={120}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="agro-user-form-dialog__footer">
            <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={loading || !form.colheitaId}>
              {loading ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar gasto"}
            </Button>
          </div>
        </form>
      </AgroFormDialog>

      <AgroFormDialog
        open={gerenciarTiposOpen}
        onClose={() => {
          setGerenciarTiposOpen(false);
          setEditandoTipo(null);
          setNovoTipo("");
        }}
        title="Gerenciar tipos de gasto"
        subtitle="Cadastre, edite e remova os tipos usados no lancamento de gastos."
        icon={Tags}
        titleId="gerenciar-tipos-gasto-title"
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className="agro-user-form-dialog__input"
              placeholder="Digite o nome do tipo"
            />
            <button
              type="button"
              className="inline-flex h-10 min-w-[8.5rem] whitespace-nowrap items-center justify-center rounded-lg bg-[#0d4f3a] px-4 text-sm font-semibold text-white"
              onClick={salvarTipo}
            >
              + Criar tipo
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tipo de gasto</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tiposCustom.map((tipo) => (
                  <tr key={tipo} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-700">{tipo}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                          aria-label={`Editar tipo ${tipo}`}
                          onClick={() => {
                            setEditandoTipo(tipo);
                            setNovoTipo(tipo);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-red-500 transition-colors hover:bg-red-50"
                          aria-label={`Excluir tipo ${tipo}`}
                          onClick={() => onDeleteTipo(tipo)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button
            type="button"
            variant="danger"
            className="w-full sm:w-auto"
            onClick={() => {
              setGerenciarTiposOpen(false);
              setEditandoTipo(null);
              setNovoTipo("");
            }}
          >
            Fechar
          </Button>
        </div>
      </AgroFormDialog>
    </>
  );
}
