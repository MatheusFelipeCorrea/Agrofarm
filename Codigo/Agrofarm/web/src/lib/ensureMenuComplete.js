/** Item obrigatório no menu (garante visível mesmo com sessão antiga em cache). */
export const NOTICIAS_MENU_ITEM = {
  id: "noticias",
  label: "Notícias",
  path: "/noticias",
  icon: "noticias",
  children: [],
};

/**
 * Injeta Notícias se o menu persistido vier de uma versão anterior do sistema.
 * @param {Array} menu
 * @param {string} [role]
 */
export function ensureMenuComplete(menu, role) {
  if (role !== "ADMIN") {
    return Array.isArray(menu) ? menu : [];
  }

  const items = Array.isArray(menu) ? [...menu] : [];
  if (items.some((item) => item?.id === "noticias")) {
    return items;
  }

  const dashboardIdx = items.findIndex((item) => item?.id === "dashboard");
  const insertAt = dashboardIdx >= 0 ? dashboardIdx + 1 : 0;
  items.splice(insertAt, 0, NOTICIAS_MENU_ITEM);
  return items;
}
