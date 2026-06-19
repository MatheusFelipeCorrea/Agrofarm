import { useEffect, useMemo } from "react";
import { Package } from "lucide-react";
import AgroFormDialog from "../../../components/dialogs/AgroFormDialog.jsx";
import Button from "../../../components/ui/Button/Button.jsx";
import Select from "../../../components/ui/Select/Select.jsx";
import DatePickerInput from "../../../components/ui/DatePickerInput.jsx";
import { CATEGORIAS, UNIDADES } from "../insumosConstants.js";
import {
  FAZENDA_SOMENTE_LEITURA_MENSAGEM,
  podeOperarFazenda,
} from "../../../utils/fazendaOperacao.js";

export default function InsumoFormModal({
  open,
  onClose,
  title,
  submitLabel,
  loading,
  form,
  setForm,
  onSubmit,
  fazendas,
  role,
}) {
  const isFuncionario = role === "FUNCIONARIO";
  const hasSingleFarm = (fazendas?.length ?? 0) === 1;
  const showFarmSelect = role === "ADMIN" || !hasSingleFarm;

  useEffect(() => {
    if (!open || !isFuncionario || !hasSingleFarm || form.fazendaId) return;
    setForm((previous) => ({ ...previous, fazendaId: fazendas[0].id }));
  }, [open, isFuncionario, hasSingleFarm, form.fazendaId, fazendas, setForm]);

  const fazendaSelecionadaId = form.fazendaId || (isFuncionario && hasSingleFarm ? fazendas?.[0]?.id ?? "" : "");

  const fazendaSelecionada = useMemo(
    () => (fazendas ?? []).find((fazenda) => fazenda.id === fazendaSelecionadaId) ?? null,
    [fazendas, fazendaSelecionadaId],
  );

  const fazendaSomenteLeitura = Boolean(
    fazendaSelecionadaId && !podeOperarFazenda(fazendaSelecionada),
  );

  const subtitle = title?.toLowerCase().includes("edit")
    ? "Atualize as informacoes do consumo selecionado."
    : "Cadastre um novo consumo para acompanhar os insumos da fazenda.";

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Package}
      titleId="insumo-form-title"
      errorMessage={fazendaSomenteLeitura ? FAZENDA_SOMENTE_LEITURA_MENSAGEM : undefined}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (fazendaSomenteLeitura) return;
          onSubmit();
        }}
      >
        <div className="agro-user-form-dialog__grid">
          {showFarmSelect ? (
            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label">Fazenda</label>
              <Select
                value={form.fazendaId}
                onChange={(event) => setForm((previous) => ({ ...previous, fazendaId: event.target.value }))}
                placeholder="Selecione a fazenda"
              >
                {fazendas.map((fazenda) => (
                  <option key={fazenda.id} value={fazenda.id}>
                    {fazenda.nome}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label">Fazenda</label>
              <input
                value={fazendas?.[0]?.nome ?? ""}
                readOnly
                className="agro-user-form-dialog__input bg-gray-50"
              />
            </div>
          )}

          {!fazendaSomenteLeitura ? (
            <>
          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Nome do insumo</label>
            <input
              value={form.item}
              onChange={(event) => setForm((previous) => ({ ...previous, item: event.target.value }))}
              className="agro-user-form-dialog__input"
              placeholder="Ex.: Adubo"
              required
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Categoria</label>
            <Select
              value={form.categoria}
              onChange={(event) => setForm((previous) => ({ ...previous, categoria: event.target.value }))}
              includeEmptyOption={false}
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria.value} value={categoria.value}>
                  {categoria.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Unidade</label>
            <Select
              value={form.unidade}
              onChange={(event) => setForm((previous) => ({ ...previous, unidade: event.target.value }))}
              includeEmptyOption={false}
            >
              {UNIDADES.map((unidade) => (
                <option key={unidade} value={unidade}>
                  {unidade}
                </option>
              ))}
            </Select>
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Quantidade</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.quantidade}
              onChange={(event) => setForm((previous) => ({ ...previous, quantidade: event.target.value }))}
              className="agro-user-form-dialog__input"
              placeholder="0,00"
              required
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Valor unitario (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.valorUnitario}
              onChange={(event) => setForm((previous) => ({ ...previous, valorUnitario: event.target.value }))}
              className="agro-user-form-dialog__input"
              placeholder="0,00"
              required
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Fornecedor</label>
            <input
              value={form.fornecedor}
              onChange={(event) => setForm((previous) => ({ ...previous, fornecedor: event.target.value }))}
              className="agro-user-form-dialog__input"
              placeholder="Opcional"
            />
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label">Data</label>
            <DatePickerInput
              value={form.data}
              onChange={(value) => setForm((previous) => ({ ...previous, data: value }))}
              placeholder="Selecione a data"
            />
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="insumo-observacao">
              Observacao (opcional)
            </label>
            <textarea
              id="insumo-observacao"
              rows={3}
              value={form.observacao}
              onChange={(event) => setForm((previous) => ({ ...previous, observacao: event.target.value }))}
              placeholder="Digite uma observacao"
              className="agro-user-form-dialog__input min-h-[4.5rem] resize-none py-2"
            />
          </div>
            </>
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
            disabled={loading || fazendaSomenteLeitura || !form.fazendaId || !form.item || !form.data}
          >
            {loading ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}
