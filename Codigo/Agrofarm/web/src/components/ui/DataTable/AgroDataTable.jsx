import { EyeIcon, PencilIcon, TrashIcon } from "../icons.jsx";
import { agroTable } from "./agroDataTableStyles.js";

export { agroTable };

export function AgroDataTable({
  minWidth = 960,
  children,
  footer,
  embedded = false,
  className = "",
  style,
  loading = false,
  loadingMessage = "Carregando registros...",
}) {
  if (loading && !embedded) {
    return <section className={agroTable.loadingSection}>{loadingMessage}</section>;
  }

  const table = (
    <div className={agroTable.scroll}>
      <table className={agroTable.table} style={{ minWidth: `${minWidth}px` }}>
        {children}
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div className={className} style={style}>
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500">{loadingMessage}</p>
        ) : (
          table
        )}
        {footer}
      </div>
    );
  }

  return (
    <section className={`${agroTable.section} ${className}`.trim()}>
      {loading ? (
        <p className="p-10 text-center text-sm text-gray-600">{loadingMessage}</p>
      ) : (
        table
      )}
      {footer}
    </section>
  );
}

export function AgroDataTableHead({ children }) {
  return (
    <thead>
      <tr className={agroTable.headRow}>{children}</tr>
    </thead>
  );
}

export function AgroDataTableTh({ align = "center", className = "", children }) {
  return <th className={`${agroTable.th(align)} ${className}`.trim()}>{children}</th>;
}

export function AgroDataTableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function AgroDataTableRow({ children, onClick, className = "" }) {
  const rowClass = onClick ? agroTable.rowInteractive : agroTable.row;
  return (
    <tr className={`${rowClass} ${className}`.trim()} onClick={onClick}>
      {children}
    </tr>
  );
}

export function AgroDataTableTd({ align = "center", className = "", children, colSpan, onClick }) {
  return (
    <td
      colSpan={colSpan}
      className={`${agroTable.td(align)} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </td>
  );
}

export function AgroDataTableEmpty({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className={agroTable.empty}>
        {children}
      </td>
    </tr>
  );
}

export function AgroDataTableActions({ children }) {
  return <div className={agroTable.actions}>{children}</div>;
}

export function AgroDataTableEditButton({ onClick, label = "Editar", disabled }) {
  return (
    <button
      type="button"
      className={agroTable.actionBtn}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  );
}

export function AgroDataTableDeleteButton({ onClick, label = "Excluir", disabled }) {
  return (
    <button
      type="button"
      className={agroTable.actionBtnDanger}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}

export function AgroDataTableViewButton({ onClick, label = "Ver detalhes", disabled }) {
  return (
    <button
      type="button"
      className={agroTable.actionBtn}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <EyeIcon className="h-4 w-4" />
    </button>
  );
}
