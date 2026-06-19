import { useEffect, useMemo } from "react";
import { Wheat } from "lucide-react";
import AgroFormDialog from "../../../components/dialogs/AgroFormDialog.jsx";
import Button from "../../../components/ui/Button/Button.jsx";
import Select from "../../../components/ui/Select/Select.jsx";
import DatePickerInput from "../../../components/ui/DatePickerInput.jsx";
import { useCulturasDaFazendaQuery } from "../../../queries/fazenda/useFazendaQueries.js";
import {
  FAZENDA_SEM_CULTURAS_VINCULADAS_MENSAGEM,
  FAZENDA_SOMENTE_LEITURA_MENSAGEM,
  podeOperarFazenda,
} from "../../../utils/fazendaOperacao.js";

export default function ColheitaUpsertModal({
  open,
  mode,
  onClose,
  loading,
  form,
  setForm,
  onSubmit,
  fazendas,
  role,
}) {
  const isEdit = mode === "edit";
  const isFuncionario = role === "FUNCIONARIO";

  const title = isEdit ? "Editar colheita" : "Nova colheita";
  const subtitle = isEdit
    ? "Atualize as informacoes da colheita selecionada."
    : "Cadastre uma nova colheita para acompanhar sua producao.";

  const fazendasPermitidas = fazendas ?? [];

  const mostrarCampoFazenda = role === "ADMIN" || fazendasPermitidas.length > 1;

  useEffect(() => {
    if (!open || !isFuncionario) return;
    if (fazendasPermitidas.length === 1 && !form.fazendaId) {
      setForm((prev) => ({ ...prev, fazendaId: fazendasPermitidas[0].id }));
    }
  }, [open, isFuncionario, fazendasPermitidas, form.fazendaId, setForm]);

  const fazendaSelecionadaId = form.fazendaId || (isFuncionario && fazendasPermitidas.length === 1 ? fazendasPermitidas[0].id : "");

  const fazendaSelecionada = useMemo(
    () => (fazendas ?? []).find((f) => f.id === fazendaSelecionadaId) ?? null,
    [fazendas, fazendaSelecionadaId],
  );

  const fazendaSomenteLeitura = Boolean(
    fazendaSelecionadaId && !podeOperarFazenda(fazendaSelecionada),
  );

  const { data: culturasDaFazenda = [], isFetched: culturasDaFazendaCarregadas } = useCulturasDaFazendaQuery(
    fazendaSelecionadaId,
    {
      enabled: open && Boolean(fazendaSelecionadaId) && !fazendaSomenteLeitura,
    },
  );

  const culturasFiltradas = useMemo(() => {
    if (!fazendaSelecionadaId) return [];

    const mapa = new Map();

    (culturasDaFazenda ?? []).forEach((vinculo) => {
      const cultura = vinculo?.cultura;
      if (cultura?.id) {
        mapa.set(cultura.id, {
          id: cultura.id,
          nome: cultura.nome,
          cor: cultura.cor,
        });
      }
    });

    return Array.from(mapa.values());
  }, [culturasDaFazenda, fazendaSelecionadaId]);

  const semCulturasVinculadas = Boolean(
    fazendaSelecionadaId
    && !fazendaSomenteLeitura
    && culturasDaFazendaCarregadas
    && culturasFiltradas.length === 0,
  );

  const bloqueioOperacional = fazendaSomenteLeitura || semCulturasVinculadas;

  const mensagemBloqueio = fazendaSomenteLeitura
    ? FAZENDA_SOMENTE_LEITURA_MENSAGEM
    : semCulturasVinculadas
      ? FAZENDA_SEM_CULTURAS_VINCULADAS_MENSAGEM
      : undefined;

  useEffect(() => {
    if (!open || !semCulturasVinculadas) return;
    if (form.culturaId) {
      setForm((prev) => ({ ...prev, culturaId: "" }));
    }
  }, [open, semCulturasVinculadas, form.culturaId, setForm]);

  if (!open) return null;

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Wheat}
      titleId={isEdit ? "editar-colheita-title" : "nova-colheita-title"}
      errorMessage={mensagemBloqueio}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloqueioOperacional) return;
          onSubmit();
        }}
      >
        <div className="agro-user-form-dialog__grid">
          {mostrarCampoFazenda ? (
            <div className="agro-user-form-dialog__field">
              <label className="agro-user-form-dialog__label">Fazenda</label>
              <Select
                value={form.fazendaId}
                onChange={(e) => setForm((prev) => ({ ...prev, fazendaId: e.target.value, culturaId: "" }))}
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

          {!bloqueioOperacional ? (
            <>
              <div className="agro-user-form-dialog__field">
                <label className="agro-user-form-dialog__label">Cultura</label>
                <Select
                  value={form.culturaId}
                  onChange={(e) => setForm((prev) => ({ ...prev, culturaId: e.target.value }))}
                  placeholder={fazendaSelecionadaId ? "Selecione a cultura" : "Selecione a fazenda primeiro"}
                  disabled={!fazendaSelecionadaId}
                >
                  {culturasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </div>

              <div className="agro-user-form-dialog__field">
                <label className="agro-user-form-dialog__label">Data da colheita</label>
                <DatePickerInput
                  value={form.dataColheita}
                  onChange={(value) => setForm((prev) => ({ ...prev, dataColheita: value }))}
                  placeholder="Selecione a data"
                />
              </div>

              <div className="agro-user-form-dialog__field">
                <label className="agro-user-form-dialog__label">Sacas produzidas</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sacasProduzidas}
                  onChange={(e) => setForm((prev) => ({ ...prev, sacasProduzidas: e.target.value }))}
                  className="agro-user-form-dialog__input"
                  placeholder="0"
                  required
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
            disabled={
              loading
              || bloqueioOperacional
              || !form.fazendaId
              || !form.culturaId
              || !form.dataColheita
              || !form.sacasProduzidas
            }
          >
            {loading ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar colheita"}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}

