import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_DEFAULT = 5;

export function getVisiblePages(currentPage, totalPages) {
  const pages = [];
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, startPage + 2);
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  return pages;
}

/**
 * Paginação client-side (máx. pageSize itens por página).
 */
export function useClientPagination(items, pageSize = PAGE_SIZE_DEFAULT) {
  const [page, setPage] = useState(1);
  const totalItems = items?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [totalItems, pageSize]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items ?? []).slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    paginatedItems,
    totalItems,
    totalPages,
    start,
    end,
    showPagination: totalItems > pageSize,
  };
}
