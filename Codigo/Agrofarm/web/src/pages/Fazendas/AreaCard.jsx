import {
  AgroDataTableActions,
  AgroDataTableDeleteButton,
  AgroDataTableEditButton,
} from "../../components/ui/DataTable/AgroDataTable.jsx";
import { CulturaPill } from "./fazendaListUi.jsx";
import { isCulturaCafe } from "../../utils/culturaStatus.js";

function formatarData(dataISO) {
  if (!dataISO) return null;
  try {
    const d = new Date(dataISO);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return null;
  }
}

export default function AreaCard({ poligono, selecionado, onClick, onEditar, onExcluir, somenteLeitura = false, bloqueioTitulo }) {
  const podeEditar = !somenteLeitura && Boolean(onEditar);
  const podeExcluir = !somenteLeitura && Boolean(onExcluir);
  const dataFormatada = formatarData(poligono.data_plantio);
  const colheitaFormatada = formatarData(poligono.data_colheita);
  const ehCafe = isCulturaCafe(poligono.cultura_nome);

  return (
    <div
      className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors duration-150 hover:bg-gray-50 ${
        selecionado ? "border-l-4 border-l-[var(--agro-brand)] bg-green-50" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 truncate">{poligono.nome}</span>
            <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
              {Number(poligono.area_hectares).toFixed(2)} ha
            </span>
          </div>

          {poligono.cultura_nome && (
            <div className="mt-1">
              <CulturaPill nome={poligono.cultura_nome} cor={poligono.cultura_cor} />
            </div>
          )}

          {dataFormatada ? (
            <p className="mt-1 text-xs text-gray-500">Plantio realizado em {dataFormatada}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Data de plantio não informada</p>
          )}

          {colheitaFormatada ? (
            <p className="mt-0.5 text-xs text-gray-500">Colheita prevista em {colheitaFormatada}</p>
          ) : ehCafe ? (
            <p className="mt-0.5 text-xs text-amber-700">Informe a data da próxima colheita</p>
          ) : null}
        </div>

        {(podeEditar || podeExcluir) ? (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
            <AgroDataTableActions>
              {podeEditar ? (
                <AgroDataTableEditButton
                  label={`Editar ${poligono.nome}`}
                  onClick={() => onEditar?.()}
                />
              ) : null}
              {podeExcluir ? (
                <AgroDataTableDeleteButton
                  label={`Excluir ${poligono.nome}`}
                  onClick={() => onExcluir?.()}
                />
              ) : null}
            </AgroDataTableActions>
          </div>
        ) : somenteLeitura ? (
          <span className="shrink-0 text-[10px] font-medium text-gray-400" title={bloqueioTitulo}>
            Somente leitura
          </span>
        ) : null}
      </div>
    </div>
  );
}
