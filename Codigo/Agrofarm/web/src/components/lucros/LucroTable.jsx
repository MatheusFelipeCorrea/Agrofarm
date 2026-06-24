import { CulturaPill } from "../../pages/Fazendas/fazendaListUi.jsx";
import { LucroSituacaoBadge } from "../ui/badges/DomainBadges.jsx";
import AgroDataTableFooter from "../ui/DataTable/AgroDataTableFooter.jsx";
import {
  AgroDataTable,
  AgroDataTableBody,
  AgroDataTableDeleteButton,
  AgroDataTableEditButton,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
  agroTable,
} from "../ui/DataTable/AgroDataTable.jsx";
import { formatBRL, formatDate } from "../../utils/formatters.js";

const COL_LABELS = [
  { label: "Fazenda", align: "left" },
  { label: "Referência", align: "center" },
  { label: "Cultura", align: "center" },
  { label: "Sacas", align: "center" },
  { label: "Valor", align: "center" },
  { label: "Total", align: "center" },
  { label: "Comprador", align: "center" },
  { label: "Data", align: "center" },
  { label: "Situação", align: "center" },
  { label: "Ações", align: "center" },
];

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {COL_LABELS.map(({ label, align }) => (
        <td key={label} className={agroTable.td(align)}>
          <div
            className="mx-auto h-3 max-w-[70%] rounded-full bg-gray-200"
            style={align === "left" ? { margin: 0 } : undefined}
          />
        </td>
      ))}
    </tr>
  );
}

export default function LucroTable({
  items,
  onEdit,
  onDelete,
  loading,
  meta,
  onPageChange,
}) {
  const page = meta?.page ?? 1;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const totalItems = meta?.totalItems ?? items.length;
  const pageSize = Math.max(1, meta?.pageSize ?? items.length ?? 1);

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return (
    <AgroDataTable
      minWidth={1100}
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
        {COL_LABELS.map(({ label, align }) => (
          <AgroDataTableTh key={label} align={align}>
            {label}
          </AgroDataTableTh>
        ))}
      </AgroDataTableHead>

      <AgroDataTableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : items.length === 0 ? (
          <AgroDataTableEmpty colSpan={COL_LABELS.length}>
            Nenhum registro encontrado para os filtros selecionados.
          </AgroDataTableEmpty>
        ) : (
          items.map((row) => (
            <AgroDataTableRow key={row.id}>
              <AgroDataTableTd align="left" className="font-medium text-gray-900">
                {row.fazenda?.nome ?? "—"}
              </AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-600">
                #{row.colheita?.ano ?? row.colheitaId?.slice(0, 4) ?? "—"}
              </AgroDataTableTd>
              <AgroDataTableTd>
                {row.cultura ? (
                  <div className="flex justify-center">
                    <CulturaPill nome={row.cultura.nome} cor={row.cultura.cor} />
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-700">
                {row.quantidadeSacas ?? "—"}
              </AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-green-700">
                {formatBRL(row.valorUnitario)}
              </AgroDataTableTd>
              <AgroDataTableTd className="font-semibold tabular-nums text-green-700">
                {formatBRL(row.total)}
              </AgroDataTableTd>
              <AgroDataTableTd className="text-gray-700">{row.comprador ?? "—"}</AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-700">{formatDate(row.data)}</AgroDataTableTd>
              <AgroDataTableTd>
                <div className="flex justify-center">
                  <LucroSituacaoBadge origem={row.origem} />
                </div>
              </AgroDataTableTd>
              <AgroDataTableTd>
                <div className="flex items-center justify-center gap-2">
                  <AgroDataTableEditButton onClick={() => onEdit(row)} label="Editar lucro" />
                  <AgroDataTableDeleteButton onClick={() => onDelete(row)} label="Excluir lucro" />
                </div>
              </AgroDataTableTd>
            </AgroDataTableRow>
          ))
        )}
      </AgroDataTableBody>
    </AgroDataTable>
  );
}
