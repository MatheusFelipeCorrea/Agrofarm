import { formatDateBR, formatPhoneMasked } from "../../utils/formatters.js";
import AgroDataTableFooter from "../ui/DataTable/AgroDataTableFooter.jsx";
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
} from "../ui/DataTable/AgroDataTable.jsx";
import UsuarioRoleBadge from "./UsuarioRoleBadge.jsx";
import { UsuarioAtivoBadge } from "../ui/badges/DomainBadges.jsx";
import { USUARIOS_TABLE_HEADERS } from "./usuariosConstants.js";

function UsuarioRow({ usuario, onEdit, onRequestDelete, canDelete }) {
  const iniciais = String(usuario.nome ?? "US")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <AgroDataTableRow>
      <AgroDataTableTd align="left" className="font-medium text-gray-900">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ecf5ec] text-xs font-semibold text-[#3b8f4f]">
            {iniciais || "US"}
          </span>
          <span className="truncate">{usuario.nome}</span>
        </div>
      </AgroDataTableTd>
      <AgroDataTableTd className="max-w-0 truncate" title={usuario.email}>
        {usuario.email}
      </AgroDataTableTd>
      <AgroDataTableTd className="tabular-nums">{formatPhoneMasked(usuario.telefone)}</AgroDataTableTd>
      <AgroDataTableTd className="tabular-nums">{formatDateBR(usuario.criadoEm)}</AgroDataTableTd>
      <AgroDataTableTd>
        <div className="flex flex-wrap justify-center">
          <UsuarioRoleBadge role={usuario.role} />
        </div>
      </AgroDataTableTd>
      <AgroDataTableTd>
        <UsuarioAtivoBadge />
      </AgroDataTableTd>
      <AgroDataTableTd>
        <AgroDataTableActions>
          <AgroDataTableEditButton label={`Editar ${usuario.nome}`} onClick={() => onEdit(usuario)} />
          {canDelete ? (
            <AgroDataTableDeleteButton
              label={`Excluir ${usuario.nome}`}
              onClick={() => onRequestDelete(usuario)}
            />
          ) : null}
        </AgroDataTableActions>
      </AgroDataTableTd>
    </AgroDataTableRow>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {USUARIOS_TABLE_HEADERS.map((label, index) => (
        <td key={label} className={agroTable.td(index === 0 ? "left" : "center")}>
          <div
            className="h-3 rounded-full bg-gray-200"
            style={{
              width: index === 6 ? "3rem" : "70%",
              margin: index === 0 ? undefined : "0 auto",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function UsuariosTable({
  usuarios,
  totalFiltrados = 0,
  currentPage = 1,
  totalPaginas = 1,
  itensPorPagina = 5,
  onPageChange,
  isLoading,
  onEdit,
  onRequestDelete,
  currentUserId,
}) {
  const inicioAtual = totalFiltrados === 0 ? 0 : (currentPage - 1) * itensPorPagina + 1;
  const fimAtual = totalFiltrados === 0 ? 0 : Math.min(currentPage * itensPorPagina, totalFiltrados);

  return (
    <AgroDataTable
      minWidth={960}
      footer={
        <AgroDataTableFooter
          start={inicioAtual}
          end={fimAtual}
          totalItems={totalFiltrados}
          itemLabel={totalFiltrados === 1 ? "usuário" : "usuários"}
          page={currentPage}
          totalPages={totalPaginas}
          onPageChange={onPageChange}
        />
      }
    >
      <AgroDataTableHead>
        {USUARIOS_TABLE_HEADERS.map((label, index) => (
          <AgroDataTableTh key={label} align={index === 0 ? "left" : "center"}>
            {label}
          </AgroDataTableTh>
        ))}
      </AgroDataTableHead>

      <AgroDataTableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : usuarios.length === 0 ? (
          <AgroDataTableEmpty colSpan={USUARIOS_TABLE_HEADERS.length}>
            Nenhum registro encontrado para os filtros selecionados.
          </AgroDataTableEmpty>
        ) : (
          usuarios.map((usuario) => (
            <UsuarioRow
              key={usuario.id}
              usuario={usuario}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              canDelete={usuario.id !== currentUserId}
            />
          ))
        )}
      </AgroDataTableBody>
    </AgroDataTable>
  );
}
