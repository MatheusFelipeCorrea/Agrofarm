export function isPathActive(pathname, itemPath) {
  if (!itemPath) return false;
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function hasActiveChild(pathname, item) {
  const children = Array.isArray(item?.children) ? item.children : [];
  return children.some((child) => isPathActive(pathname, child?.path));
}

export function getDefaultExpandedGroupIds(menu, pathname) {
  if (!Array.isArray(menu)) return [];

  return menu
    .filter((item) => Array.isArray(item?.children) && item.children.length > 0)
    .filter((item) => hasActiveChild(pathname, item))
    .map((item) => item.id)
    .filter(Boolean);
}
