import { useEffect, useMemo } from "react";
import { useBreadcrumbStore } from "../store/breadcrumbStore.js";

function breadcrumbKey(items) {
  if (!items?.length) return "";
  return items.map((item) => `${item.label}|${item.to ?? ""}`).join(">");
}

/**
 * Define breadcrumbs no MainLayout (telas de detalhe / hierarquia).
 * Telas de listagem (Fazendas, Gastos, etc.) não devem usar — o título da página já basta.
 * @param {Array<{ label: string, to?: string }>|null} items
 */
export function usePageBreadcrumbs(items) {
  const setItems = useBreadcrumbStore((s) => s.setItems);
  const clearItems = useBreadcrumbStore((s) => s.clearItems);
  const key = useMemo(() => breadcrumbKey(items), [items]);

  useEffect(() => {
    if (!items?.length) {
      clearItems();
      return undefined;
    }
    setItems(items);
    return () => clearItems();
  }, [key, setItems, clearItems]);
}
