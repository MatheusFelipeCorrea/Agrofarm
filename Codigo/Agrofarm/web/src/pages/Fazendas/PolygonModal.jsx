import { useEffect, useRef, useState } from "react";
import AgroFormDialog from "../../components/dialogs/AgroFormDialog.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import DatePickerInput from "../../components/ui/DatePickerInput.jsx";
import { ChevronDownIcon, GridIcon } from "../../components/ui/icons.jsx";
import { useCulturaListQuery } from "../../queries/cultura/useCulturaQueries.js";
import { isCulturaCafe } from "../../utils/culturaStatus.js";
import {
  validarDataColheita,
  validarDataPlantioObrigatoria,
  validarNomeTalhao,
} from "../../utils/validatePolygon.js";

export default function PolygonModal({ open, mode, initialData, areaHectares, onClose, onSubmit, loading }) {
  const { data: culturas = [] } = useCulturaListQuery();
  const [nome, setNome] = useState("");
  const [culturaId, setCulturaId] = useState("");
  const [dataPlantio, setDataPlantio] = useState("");
  const [dataColheita, setDataColheita] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroData, setErroData] = useState("");
  const [erroColheita, setErroColheita] = useState("");
  const nomeEditadoManualRef = useRef(false);

  useEffect(() => {
    if (open) {
      setNome(initialData?.nome ?? "");
      setCulturaId(initialData?.cultura_id ?? "");
      setDataPlantio(initialData?.data_plantio ? initialData.data_plantio.split("T")[0] : "");
      setDataColheita(initialData?.data_colheita ? initialData.data_colheita.split("T")[0] : "");
      setErroNome("");
      setErroData("");
      setErroColheita("");
      nomeEditadoManualRef.current = mode === "edit";
    }
  }, [open, initialData, mode]);

  const culturaSelecionada = culturas.find((c) => c.id === culturaId);
  const ehCafe = isCulturaCafe(culturaSelecionada?.nome);

  function aplicarNomePadraoCultura(nextCulturaId) {
    if (nomeEditadoManualRef.current) return;
    const cultura = culturas.find((c) => c.id === nextCulturaId);
    setNome(cultura?.nome ?? "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErroNome("");
    setErroData("");
    setErroColheita("");

    const validNome = validarNomeTalhao(nome, culturaId);
    if (!validNome.valido) {
      setErroNome(validNome.erro);
      return;
    }

    const validData = validarDataPlantioObrigatoria(dataPlantio);
    if (!validData.valido) {
      setErroData(validData.erro);
      return;
    }

    const validColheita = validarDataColheita(dataColheita, dataPlantio);
    if (!validColheita.valido) {
      setErroColheita(validColheita.erro);
      return;
    }

    const nomeEnviado = nome.trim() || culturaSelecionada?.nome?.trim() || "";

    await onSubmit({
      nome: nomeEnviado,
      cultura_id: culturaId || null,
      data_plantio: dataPlantio || null,
      data_colheita: dataColheita || null,
    });
  }

  const titulo = mode === "edit" ? "Editar área" : "Criar nova área";
  const subtitulo =
    mode === "edit"
      ? "Atualize cultura, nome e data de plantio do talhão selecionado."
      : "Informe os dados do talhão desenhado no mapa.";

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle={subtitulo}
      icon={GridIcon}
      titleId="polygon-modal-title"
    >
      <form onSubmit={handleSubmit}>
        <div className="agro-user-form-dialog__grid">
          {areaHectares != null && (
            <div className="agro-user-form-dialog__field md:col-span-2">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
                <span className="font-semibold">Área calculada:</span>{" "}
                <span className="tabular-nums">{Number(areaHectares).toFixed(2)} ha</span>
              </div>
            </div>
          )}

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="poligono-cultura">
              Cultura plantada
            </label>
            <div className="relative">
              <select
                id="poligono-cultura"
                value={culturaId}
                onChange={(e) => {
                  const next = e.target.value;
                  setCulturaId(next);
                  aplicarNomePadraoCultura(next);
                }}
                className={`agro-user-form-dialog__select ${!culturaId ? "agro-user-form-dialog__select--muted" : ""}`}
              >
                <option value="">Selecione a cultura</option>
                {culturas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              O nome do talhão usa o nome da cultura por padrão; você pode personalizar abaixo.
            </p>
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            <label className="agro-user-form-dialog__label" htmlFor="poligono-nome">
              Nome do talhão
            </label>
            <input
              id="poligono-nome"
              type="text"
              placeholder="Ex.: Soja, Talhão Norte"
              value={nome}
              onChange={(e) => {
                nomeEditadoManualRef.current = true;
                setNome(e.target.value.slice(0, 100));
              }}
              maxLength={100}
              className="usuario-form-modal-input agro-user-form-dialog__input"
            />
            {erroNome && <p className="mt-1 text-xs text-red-600">{erroNome}</p>}
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="poligono-data-plantio">
              Data de plantio
            </label>
            <DatePickerInput
              id="poligono-data-plantio"
              value={dataPlantio}
              onChange={setDataPlantio}
              placeholder="Selecione a data de plantio"
            />
            {erroData && <p className="mt-1 text-xs text-red-600">{erroData}</p>}
          </div>

          <div className="agro-user-form-dialog__field">
            <label className="agro-user-form-dialog__label" htmlFor="poligono-data-colheita">
              Data de colheita
            </label>
            <DatePickerInput
              id="poligono-data-colheita"
              value={dataColheita}
              onChange={setDataColheita}
              placeholder="Selecione a data de colheita"
            />
            {erroColheita && <p className="mt-1 text-xs text-red-600">{erroColheita}</p>}
          </div>

          <div className="agro-user-form-dialog__field md:col-span-2">
            {ehCafe ? (
              <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                Café é uma cultura perene: após a colheita a área <strong>permanece no mapa</strong>.
                A safra será registrada no histórico e você deverá informar a data da próxima colheita.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Um dia após a data de colheita, a área é arquivada automaticamente no histórico e
                removida do mapa.
              </p>
            )}
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
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Salvando…" : mode === "edit" ? "Salvar Alterações" : "Criar Área"}
          </Button>
        </div>
      </form>
    </AgroFormDialog>
  );
}
