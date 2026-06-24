import { GastoStatusBadge } from "../../../components/ui/badges/DomainBadges.jsx";
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
  agroTable,
} from "../../../components/ui/DataTable/AgroDataTable.jsx";
import { formatBRL, formatDate } from "../../../utils/formatters.js";

function getColheitaLabel(row) {
  const fazenda = row.fazenda?.nome ?? row.colheita?.fazenda?.nome;
  const cultura = row.cultura?.nome ?? row.colheita?.cultura?.nome;
  const ano = row.colheita?.ano;

  const partes = [fazenda, cultura, ano != null && ano !== "" ? String(ano) : null].filter(Boolean);
  return partes.length ? partes.join(" · ") : "—";
}

const COL_LABELS = [
  { label: "Fazenda", align: "left" },
  { label: "Colheita", align: "center" },
  { label: "Tipo", align: "center" },
  { label: "Valor", align: "center" },
  { label: "Data", align: "center" },
  { label: "Vencimento", align: "center" },
  { label: "Status", align: "center" },
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

function isGastoPendente(row) {
  return row.status !== "PAGO";
}

export default function GastosTable({
  items,
  onEdit,
  onDelete,
  onMarcarPago,
  marcarPagoBusyId = null,
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
          items.map((row) => {
            const pendente = isGastoPendente(row);
            const rowKey = row.id;
            const busy = marcarPagoBusyId === rowKey;

            return (
            <AgroDataTableRow key={rowKey}>
              <AgroDataTableTd align="left" className="font-semibold text-gray-800">
                {row.fazenda?.nome ?? "—"}
              </AgroDataTableTd>
              <AgroDataTableTd align="center" className="whitespace-normal break-words text-gray-600">
                {getColheitaLabel(row)}
              </AgroDataTableTd>
              <AgroDataTableTd>
                {row.tipo === "OUTRO" ? row.tipoPersonalizado ?? "Outro" : row.tipo}
              </AgroDataTableTd>
              <AgroDataTableTd className="font-semibold tabular-nums text-red-600">
                {formatBRL(row.valor)}
              </AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-500">{formatDate(row.data)}</AgroDataTableTd>
              <AgroDataTableTd className="tabular-nums text-gray-500">
                {formatDate(row.dataVencimento)}
              </AgroDataTableTd>
              <AgroDataTableTd>
                <div className="flex justify-center">
                  <GastoStatusBadge status={row.status} dataVencimento={row.dataVencimento} />
                </div>
              </AgroDataTableTd>
              <AgroDataTableTd>
                <div className="flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:justify-center sm:gap-2">
                  {pendente ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onMarcarPago?.(row)}
                      className="inline-flex h-8 items-center rounded-lg border border-green-200 bg-green-50 px-2.5 text-xs font-semibold text-green-800 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Marcar gasto como pago"
                    >
                      {busy ? "…" : "Marcar como pago"}
                    </button>
                  ) : null}
                  <AgroDataTableActions>
                    <AgroDataTableEditButton
                      label={`Editar gasto ${row.id}`}
                      onClick={() => onEdit(row)}
                    />
                    <AgroDataTableDeleteButton
                      label={`Excluir gasto ${row.id}`}
                      onClick={() => onDelete(row)}
                    />
                  </AgroDataTableActions>
                </div>
              </AgroDataTableTd>
            </AgroDataTableRow>
            );
          })
        )}
      </AgroDataTableBody>
    </AgroDataTable>
  );
}
