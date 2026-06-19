import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "../ui/Button/Button.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import Select from "../ui/Select/Select.jsx";
import { CalendarIcon } from "../ui/icons.jsx";
import DatePickerInput from "../ui/DatePickerInput.jsx";
import TimePickerInput from "../ui/TimePickerInput.jsx";
import { buscarColheitasPorFazenda } from "../../services/colheita/colheita.service.js";
import { usePoligonosQuery } from "../../queries/poligono/usePoligonoQueries.js";
import { normalizarPoligonoApi, rotuloTalhaoSelect } from "../../utils/poligonoTalhao.js";

const FIELD_INPUT = "agro-user-form-dialog__input";
const FIELD_SELECT = "agro-user-form-dialog__select";
const RECORRENCIAS = [
  { value: "NENHUMA", label: "Sem recorrência" },
  { value: "SEMANAL", label: "1 vez por semana" },
  { value: "MENSAL", label: "1 vez por mês" },
  { value: "TRIMESTRAL", label: "1 vez a cada 3 meses" },
  { value: "ANUAL", label: "1 vez por ano" },
  { value: "OUTROS", label: "Outros" },
];

export default function LembreteFormModal({ item, onClose, onSubmit, fazendas = [], loading = false }) {
  const isEdit = !!item?.id;
  const [localError, setLocalError] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data: "",
    hora: "",
    telefone: "",
    fazendaId: "",
    poligonoId: "",
    colheitaId: "",
    recorrencia: "NENHUMA",
    recorrenciaCustom: "",
  });

  const fazendaAtiva = form.fazendaId || null;

  const { data: poligonosRaw = [] } = usePoligonosQuery(fazendaAtiva);
  const poligonos = useMemo(
    () => poligonosRaw.map(normalizarPoligonoApi),
    [poligonosRaw],
  );

  const { data: colheitas = [] } = useQuery({
    queryKey: ["colheitas", "fazenda", fazendaAtiva, "lembrete-form"],
    queryFn: () => buscarColheitasPorFazenda(fazendaAtiva),
    enabled: Boolean(fazendaAtiva),
    staleTime: 30_000,
  });

  const colheitasOrdenadas = useMemo(
    () =>
      [...colheitas].sort((a, b) => Number(b.ano) - Number(a.ano) || (b.dataColheita ?? "").localeCompare(a.dataColheita ?? "")),
    [colheitas],
  );

  useEffect(() => {
    if (!item) return;

    if (isEdit) {
      const dataObj = item.dataLembrete
        ? new Date(item.dataLembrete)
        : null;

      const dataLocal = dataObj
        ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, "0")}-${String(dataObj.getDate()).padStart(2, "0")}`
        : "";
      const horaLocal = dataObj
        ? `${String(dataObj.getHours()).padStart(2, "0")}:${String(dataObj.getMinutes()).padStart(2, "0")}`
        : "";

      setForm({
        titulo: item.titulo || "",
        descricao: item.descricao || "",
        data: dataLocal,
        hora: horaLocal,
        telefone: item.telefoneWhatsapp || "",
        fazendaId: item.fazendaId || "",
        poligonoId: item.poligonoId || "",
        colheitaId: item.colheitaId || "",
        recorrencia: item.recorrencia || "NENHUMA",
        recorrenciaCustom: item.recorrenciaCustom || "",
      });
    } else {
      setForm({
        titulo: "",
        descricao: "",
        data: item.data || "",
        hora: "",
        telefone: "",
        fazendaId: item.fazendaId || "",
        poligonoId: "",
        colheitaId: "",
        recorrencia: "NENHUMA",
        recorrenciaCustom: "",
      });
    }

    setLocalError("");
  }, [
    isEdit,
    item?.id,
    item?.titulo,
    item?.descricao,
    item?.dataLembrete,
    item?.telefoneWhatsapp,
    item?.fazendaId,
    item?.data,
    item?.poligonoId,
    item?.colheitaId,
  ]);

  if (!item) return null;

  const handleChange = (e) => {
    if (localError) setLocalError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const titulo = form.titulo.trim();
    if (titulo.length < 3) {
      setLocalError("Título deve ter ao menos 3 caracteres.");
      return;
    }

    if (!form.data || !form.hora) {
      setLocalError("Preencha data e hora do lembrete.");
      return;
    }

    if (form.recorrencia === "OUTROS" && !form.recorrenciaCustom.trim()) {
      setLocalError("Informe a recorrência personalizada para a opção Outros.");
      return;
    }

    const dataCompleta = new Date(`${form.data}T${form.hora}`);
    if (Number.isNaN(dataCompleta.getTime())) {
      setLocalError("Data/hora inválida. Ajuste os campos e tente novamente.");
      return;
    }

    const payload = {
      titulo,
      descricao: form.descricao?.trim() || "",
      dataLembrete: dataCompleta.toISOString(),
      telefoneWhatsapp: form.telefone?.trim() || "",
      fazendaId: form.fazendaId || null,
      poligonoId: form.poligonoId || null,
      colheitaId: form.colheitaId || null,
      recorrencia: form.recorrencia,
      recorrenciaCustom: form.recorrencia === "OUTROS" ? form.recorrenciaCustom.trim() : undefined,
    };

    if (isEdit) {
      onSubmit(item.id, payload);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <AgroFormDialog
      open={Boolean(item)}
      onClose={onClose}
      title={isEdit ? "Editar Lembrete" : "Criar Lembrete"}
      subtitle={isEdit ? "Atualize as informações do lembrete selecionado." : "Cadastre um novo lembrete para acompanhar tarefas importantes."}
      icon={CalendarIcon}
      titleId={isEdit ? "editar-lembrete-title" : "criar-lembrete-title"}
      errorMessage={localError}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div className="agro-user-form-dialog__grid">
          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-titulo">
              Nome do Lembrete
            </label>
            <input
              id="lembrete-titulo"
              className={FIELD_INPUT}
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ex.: Aplicar fertilizante"
              maxLength={120}
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-fazenda">
              Fazenda (Opcional)
            </label>
            <Select
              value={form.fazendaId}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((prev) => ({
                  ...prev,
                  fazendaId: e.target.value,
                  poligonoId: "",
                  colheitaId: "",
                }));
              }}
              selectClassName={FIELD_SELECT}
              placeholder="Selecione"
            >
              {fazendas.map((fazenda) => (
                <option key={fazenda.id} value={fazenda.id}>
                  {fazenda.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-talhao">
              Talhão (Opcional)
            </label>
            <Select
              value={form.poligonoId}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((prev) => ({ ...prev, poligonoId: e.target.value }));
              }}
              selectClassName={FIELD_SELECT}
              placeholder={fazendaAtiva ? "Selecione" : "Selecione a fazenda antes"}
              disabled={!fazendaAtiva}
            >
              {poligonos.map((p) => (
                <option key={p.id} value={p.id}>
                  {rotuloTalhaoSelect(p)}
                </option>
              ))}
            </Select>
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-colheita">
              Colheita (Opcional)
            </label>
            <Select
              value={form.colheitaId}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((prev) => ({ ...prev, colheitaId: e.target.value }));
              }}
              selectClassName={FIELD_SELECT}
              placeholder={fazendaAtiva ? "Selecione" : "Selecione a fazenda antes"}
              disabled={!fazendaAtiva}
            >
              {colheitasOrdenadas.map((c) => (
                <option key={c.id} value={c.id}>
                  Safra {c.ano}
                  {c.cultura?.nome ? ` — ${c.cultura.nome}` : ""}
                  {c.area != null ? ` (${Number(c.area).toLocaleString("pt-BR")} ha)` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-descricao">
              Descrição (Opcional)
            </label>
            <textarea
              id="lembrete-descricao"
              className={`${FIELD_INPUT} min-h-28 resize-y`}
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Detalhes do lembrete"
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-data">
              Data
            </label>
            <DatePickerInput
              value={form.data}
              onChange={(value) => {
                if (localError) setLocalError("");
                setForm((prev) => ({ ...prev, data: value }));
              }}
              placeholder="Selecione a data"
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-hora">
              Hora
            </label>
            <TimePickerInput
              id="lembrete-hora"
              value={form.hora}
              onChange={(value) => {
                if (localError) setLocalError("");
                setForm((prev) => ({ ...prev, hora: value }));
              }}
              placeholder="Selecione a hora"
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-telefone">
              Telefone WhatsApp (Opcional)
            </label>
            <input
              id="lembrete-telefone"
              className={FIELD_INPUT}
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(31) 99999-9999"
              maxLength={20}
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="lembrete-recorrencia">
              Recorrência
            </label>
            <Select
              value={form.recorrencia}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((prev) => ({
                  ...prev,
                  recorrencia: e.target.value,
                  recorrenciaCustom: e.target.value === "OUTROS" ? prev.recorrenciaCustom : "",
                }));
              }}
              wrapperClassName="w-full"
              selectClassName={FIELD_SELECT}
              placeholder="Selecione"
            >
              {RECORRENCIAS.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
          </div>

          {form.recorrencia === "OUTROS" ? (
            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label" htmlFor="lembrete-recorrencia-custom">
                Recorrência personalizada
              </label>
              <input
                id="lembrete-recorrencia-custom"
                className={FIELD_INPUT}
                name="recorrenciaCustom"
                value={form.recorrenciaCustom}
                onChange={handleChange}
                placeholder="Ex.: A cada 10 dias"
                maxLength={120}
              />
            </div>
          ) : null}
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={loading}>
            {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar Lembrete"}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}