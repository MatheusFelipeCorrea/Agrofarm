import { getVisiblePages } from "../../../hooks/useClientPagination.js";

/**
 * Paginação no padrão das tabelas do projeto (Fazendas, Culturas, Dashboard…).
 */
export default function TablePagination({
  page,
  totalPages,
  totalItems,
  start,
  end,
  onPageChange,
  itemLabel = "itens",
  className = "",
  compact = false,
}) {
  if (totalItems <= 0) return null;

  const height = compact ? "h-7" : "h-8";
  const minW = compact ? "min-w-7" : "min-w-8";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500 ${className}`}
    >
      <p>
        Mostrando {start} a {end} de {totalItems} {itemLabel}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className={`inline-flex ${height} w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Página anterior"
          >
            ‹
          </button>

          {getVisiblePages(page, totalPages).map((targetPage) => (
            <button
              key={targetPage}
              type="button"
              onClick={() => onPageChange(targetPage)}
              className={`inline-flex ${height} ${minW} items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors ${
                targetPage === page
                  ? "border-[#0d4f3a] bg-[#0d4f3a] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {targetPage}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={`inline-flex ${height} w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
