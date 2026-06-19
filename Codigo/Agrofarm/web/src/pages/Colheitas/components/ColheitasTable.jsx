import { CulturaPill } from "../../Fazendas/fazendaListUi.jsx";
import AgroDataTableFooter from "../../../components/ui/DataTable/AgroDataTableFooter.jsx";
import {
  AgroDataTable,
  AgroDataTableActions,
  AgroDataTableBody,
  AgroDataTableDeleteButton,
  AgroDataTableEditButton,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
} from "../../../components/ui/DataTable/AgroDataTable.jsx";
import { formatDate } from "../../../utils/formatters.js";

const COLUNAS = [
  { label: "Fazenda", align: "left" },
  { label: "Cultura", align: "center" },
  { label: "Sacas", align: "center" },
  { label: "Data da Colheita", align: "center" },
  { label: "Ações", align: "center" },
];

export default function ColheitasTable({ items, onEdit, onDelete, page, totalPages, totalItems, onPageChange }) {
  const PAGE_SIZE = 5;
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * PAGE_SIZE, totalItems);

  return (
    <AgroDataTable
      minWidth={960}
      footer={
        <AgroDataTableFooter
          start={start}
          end={end}
          totalItems={totalItems}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      }
    >
      <AgroDataTableHead>
        {COLUNAS.map(({ label, align }) => (
          <AgroDataTableTh key={label} align={align}>
            {label}
          </AgroDataTableTh>
        ))}
      </AgroDataTableHead>

      <AgroDataTableBody>
        {items.length === 0 ? (
          <AgroDataTableEmpty colSpan={COLUNAS.length}>
            Nenhum registro encontrado para os filtros selecionados.
          </AgroDataTableEmpty>
        ) : (
          items.map((row) => (
            <AgroDataTableRow key={row.id}>
              <AgroDataTableTd align="left" className="font-semibold text-gray-800">
                {row.fazenda?.nome ?? "-"}
              </AgroDataTableTd>
              <AgroDataTableTd>
                <div className="flex justify-center">
                  {row.cultura?.nome ? (
                    <CulturaPill nome={row.cultura.nome} cor={row.cultura?.cor} />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </AgroDataTableTd>
              <AgroDataTableTd className="font-medium tabular-nums text-gray-700">
                {row.sacasProduzidas}
              </AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-500">
                {formatDate(row.dataColheita)}
              </AgroDataTableTd>
              <AgroDataTableTd>
                <AgroDataTableActions>
                  <AgroDataTableEditButton
                    label={`Editar colheita ${row.id}`}
                    onClick={() => onEdit(row)}
                  />
                  <AgroDataTableDeleteButton
                    label={`Excluir colheita ${row.id}`}
                    onClick={() => onDelete(row)}
                  />
                </AgroDataTableActions>
              </AgroDataTableTd>
            </AgroDataTableRow>
          ))
        )}
      </AgroDataTableBody>
    </AgroDataTable>
  );
}
