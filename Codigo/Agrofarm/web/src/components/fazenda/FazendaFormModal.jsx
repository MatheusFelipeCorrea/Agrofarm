import { useEffect, useState } from "react";
import Button from "../ui/Button/Button.jsx";
import Select from "../ui/Select/Select.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import { HomeIcon } from "../ui/icons.jsx";
import FazendaArrendamentoFields from "./FazendaArrendamentoFields.jsx";
import LocationSearchField from "./LocationSearchField.jsx";
import {
  buildFazendaPayload,
  mapFazendaToForm,
  SITUACAO_FAZENDA,
  TIPOS_FAZENDA,
  validateFazendaForm,
} from "../../utils/fazendaForm.js";

const FIELD_INPUT = "agro-user-form-dialog__input";
const FIELD_SELECT = "agro-user-form-dialog__select";

export default function FazendaFormModal({
  open,
  fazenda = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(fazenda?.id);
  const [form, setForm] = useState(mapFazendaToForm(fazenda));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(mapFazendaToForm(fazenda));
    setLocalError("");
  }, [open, fazenda?.id, fazenda?.nome, fazenda?.tipo, fazenda?.ativa, fazenda?.localizacao]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    const erro = validateFazendaForm(form);
    if (erro) {
      setLocalError(erro);
      return;
    }

    try {
      await onSubmit(buildFazendaPayload(form));
      onClose();
    } catch {
      /* Erro da API: toast via React Query. */
    }
  }

  const situacaoValue = form.ativa !== false ? "ativa" : "inativa";
  const titleId = isEdit ? "editar-fazenda-title" : "criar-fazenda-title";

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar fazenda" : "Criar fazenda"}
      subtitle={
        isEdit
          ? "Atualize nome, localização, situação e tipo da propriedade."
          : "Cadastre uma nova fazenda para gerenciar culturas, mapa e operações."
      }
      icon={HomeIcon}
      titleId={titleId}
      errorMessage={localError}
    >
      <form onSubmit={handleSubmit}>
        <div className="agro-user-form-dialog__grid">
          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="fazenda-form-nome">
              Nome da fazenda
            </label>
            <input
              id="fazenda-form-nome"
              type="text"
              placeholder="Ex.: Fazenda Santa Maria"
              value={form.nome}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((p) => ({ ...p, nome: e.target.value.slice(0, 150) }));
              }}
              className={`usuario-form-modal-input ${FIELD_INPUT}`}
              maxLength={150}
              required
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <LocationSearchField
              id="fazenda-form-localizacao"
              value={{
                localizacao: form.localizacao,
                latitude: form.latitude,
                longitude: form.longitude,
              }}
              onChange={(loc) => {
                if (localError) setLocalError("");
                setForm((p) => ({
                  ...p,
                  localizacao: loc.localizacao ?? "",
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }));
              }}
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="fazenda-form-situacao">
              Situação
            </label>
            <Select
              id="fazenda-form-situacao"
              className={FIELD_SELECT}
              value={situacaoValue}
              includeEmptyOption={false}
              onChange={(e) => setForm((p) => ({ ...p, ativa: e.target.value === "ativa" }))}
            >
              {SITUACAO_FAZENDA.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Fazendas inativas continuam nos filtros e exibem badge no detalhe.
            </p>
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="fazenda-form-tipo">
              Tipo
            </label>
            <Select
              id="fazenda-form-tipo"
              className={FIELD_SELECT}
              value={form.tipo}
              includeEmptyOption={false}
              onChange={(e) => {
                if (localError) setLocalError("");
                setForm((p) => ({ ...p, tipo: e.target.value }));
              }}
            >
              {TIPOS_FAZENDA.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
          </div>

          {form.tipo === "ARRENDADA_PARA_TERCEIROS" ? (
            <FazendaArrendamentoFields form={form} setForm={setForm} onFieldChange={() => setLocalError("")} />
          ) : null}
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar fazenda"}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}
