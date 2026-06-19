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
import { formatBRL, formatDate } from "../../../utils/formatters.js";
import { InsumoCategoriaBadge } from "../../../components/ui/badges/DomainBadges.jsx";

export default function InsumosTable({ items, usuarioId, isAdmin, loading, onEdit, onDelete }) {
  const emptyColspan = isAdmin ? 11 : 10;

  return (
    <AgroDataTable loading={loading} minWidth={960}>
      <AgroDataTableHead>
        <AgroDataTableTh>Data</AgroDataTableTh>
        <AgroDataTableTh>Insumo</AgroDataTableTh>
        <AgroDataTableTh>Categoria</AgroDataTableTh>
        <AgroDataTableTh>Quantidade</AgroDataTableTh>
        <AgroDataTableTh>Unidade</AgroDataTableTh>
        <AgroDataTableTh>Valor unitario</AgroDataTableTh>
        <AgroDataTableTh>Valor total</AgroDataTableTh>
        <AgroDataTableTh>Fornecedor</AgroDataTableTh>
        {isAdmin ? <AgroDataTableTh>Criado por</AgroDataTableTh> : null}
        <AgroDataTableTh>Observacao</AgroDataTableTh>
        <AgroDataTableTh>Ações</AgroDataTableTh>
      </AgroDataTableHead>

      <AgroDataTableBody>
        {items.length === 0 ? (
          <AgroDataTableEmpty colSpan={emptyColspan}>
            Nenhum registro encontrado para os filtros selecionados.
          </AgroDataTableEmpty>
        ) : (
          items.map((row) => {
            const canManage = isAdmin || row.funcionarioId === usuarioId;

            return (
              <AgroDataTableRow key={row.id}>
                <AgroDataTableTd className="whitespace-nowrap tabular-nums">
                  {formatDate(row.data)}
                </AgroDataTableTd>
                <AgroDataTableTd className="font-medium text-gray-900">{row.item}</AgroDataTableTd>
                <AgroDataTableTd>
                  <InsumoCategoriaBadge categoria={row.categoria} />
                </AgroDataTableTd>
                <AgroDataTableTd className="whitespace-nowrap tabular-nums">
                  {Number(row.quantidade).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </AgroDataTableTd>
                <AgroDataTableTd>{row.unidade}</AgroDataTableTd>
                <AgroDataTableTd className="whitespace-nowrap tabular-nums">
                  {formatBRL(row.valorUnitario)}
                </AgroDataTableTd>
                <AgroDataTableTd className="text-base font-bold text-[#004d33]">
                  {formatBRL(row.valorTotal)}
                </AgroDataTableTd>
                <AgroDataTableTd
                  className="max-w-[10rem] truncate text-gray-700"
                  title={row.fornecedor ?? ""}
                >
                  {row.fornecedor ?? "-"}
                </AgroDataTableTd>
                {isAdmin ? (
                  <AgroDataTableTd
                    className="max-w-[10rem] truncate text-gray-700"
                    title={row.funcionarioNome ?? ""}
                  >
                    {row.funcionarioNome ?? "-"}
                  </AgroDataTableTd>
                ) : null}
                <AgroDataTableTd
                  className="max-w-[12rem] truncate text-gray-600"
                  title={row.observacao ?? ""}
                >
                  {row.observacao ?? "-"}
                </AgroDataTableTd>
                <AgroDataTableTd>
                  {canManage ? (
                    <AgroDataTableActions>
                      <AgroDataTableEditButton onClick={() => onEdit(row)} />
                      <AgroDataTableDeleteButton onClick={() => onDelete(row)} />
                    </AgroDataTableActions>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
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
