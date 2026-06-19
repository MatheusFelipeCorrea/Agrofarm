import { agroTable } from "./agroDataTableStyles.js";

function getVisiblePages(currentPage, totalPages) {
  const pages = [];
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, startPage + 2);
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  return pages;
}

/**
 * Rodapé de paginação no padrão Insumos/Gastos.
 */
export default function AgroDataTableFooter({
  start,
  end,
  totalItems,
  itemLabel = "resultados",
  page,
  totalPages,
  onPageChange,
  summary,
  className = "",
}) {
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className={`${agroTable.footer} ${className}`.trim()}>
      <p>
        {summary ?? (
          <>
            Mostrando {start} a {end} de {totalItems} {itemLabel}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {visiblePages.map((p) => (
          <button
            key={p}
            type="button"
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${
              p === page
                ? "border-[#0d4f3a] bg-[#0d4f3a] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  );
}
