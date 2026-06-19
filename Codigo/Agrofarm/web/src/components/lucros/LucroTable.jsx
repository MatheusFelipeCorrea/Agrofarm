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
  onMarcarRecebimento,
  isAdmin = false,
  recebimentoBusyId = null,
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
          items.map((row) => {
            const isArrendamento = row.origem === "ARRENDAMENTO";
            const busy = recebimentoBusyId === row.id;

            return (
              <AgroDataTableRow
                key={row.id}
                className={
                  isArrendamento && row.statusRecebimento === "PENDENTE"
                    ? "bg-amber-50/50 ring-1 ring-inset ring-amber-200/80"
                    : ""
                }
              >
                <AgroDataTableTd align="left" className="font-medium text-gray-900">
                  {row.fazenda?.nome ?? "—"}
                </AgroDataTableTd>
                <AgroDataTableTd className="tabular-nums text-gray-600">
                  {isArrendamento
                    ? row.colheita?.label ?? "Arrendamento"
                    : `#${row.colheita?.ano ?? row.colheitaId?.slice(0, 4) ?? "—"}`}
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
                  {isArrendamento ? "—" : (row.quantidadeSacas ?? "—")}
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
                    <LucroSituacaoBadge
                      origem={row.origem}
                      statusRecebimento={row.statusRecebimento}
                      parcelaVencida={row.parcelaVencida}
                    />
                  </div>
                </AgroDataTableTd>
                <AgroDataTableTd>
                  {isArrendamento && isAdmin ? (
                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        disabled={busy || row.statusRecebimento === "RECEBIDO"}
                        onClick={() => onMarcarRecebimento?.(row.id, "RECEBIDO")}
                        className="inline-flex h-8 min-w-[5.5rem] items-center justify-center rounded-lg border border-green-200 bg-green-50 px-2 text-xs font-semibold text-green-800 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? "…" : "Recebido"}
                      </button>
                      <button
                        type="button"
                        disabled={busy || row.statusRecebimento === "NAO_RECEBIDO"}
                        onClick={() => onMarcarRecebimento?.(row.id, "NAO_RECEBIDO")}
                        className="inline-flex h-8 min-w-[5.5rem] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Não recebido
                      </button>
                    </div>
                  ) : isArrendamento ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <AgroDataTableEditButton onClick={() => onEdit(row)} label="Editar lucro" />
                      <AgroDataTableDeleteButton onClick={() => onDelete(row)} label="Excluir lucro" />
                    </div>
                  )}
                </AgroDataTableTd>
              </AgroDataTableRow>
            );
          })
        )}
      </AgroDataTableBody>
    </AgroDataTable>
  );
}
