import { Link } from "react-router-dom";
import { ICON_MAP } from "./sidebarIconMap.js";
import { hasActiveChild, isPathActive } from "./sidebarNav.utils.js";

function IconChevron({ expanded }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function SidebarNavItem({
  item,
  pathname,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  collapsed = false,
  depth = 0,
}) {
  const Icon = ICON_MAP[item.icon] ?? ICON_MAP.fazendas;
  const children = Array.isArray(item.children) ? item.children : [];
  const hasChildren = children.length > 0;
  const isExpanded = hasChildren ? expandedGroups.has(item.id) : false;
  const isCurrent = isPathActive(pathname, item.path);
  const isChildCurrent = hasChildren ? hasActiveChild(pathname, item) : false;
  const isHighlighted = isCurrent || isChildCurrent;

  /* ── Modo colapsado: apenas ícone centralizado ── */
  if (collapsed) {
    const linkTarget = hasChildren
      ? (children.find((c) => isPathActive(pathname, c.path))?.path ?? children[0]?.path ?? "/")
      : (item.path ?? "/");

    return (
      <li>
        <Link
          to={linkTarget}
          title={item.label}
          className={`flex h-11 w-11 mx-auto items-center justify-center rounded-2xl transition-all duration-200 ${
            isHighlighted
              ? "bg-gradient-to-b from-[#0f8e69] to-[#0a6f53] text-white shadow-[0_10px_20px_-10px_rgba(8,151,109,0.8)]"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={onNavigate}
        >
          <Icon className="h-5 w-5" />
        </Link>
      </li>
    );
  }

  /* ── Modo expandido ── */
  const isNested = depth > 0;
  const baseClass = [
    "group flex w-full items-center gap-3 rounded-2xl text-left transition-all duration-200",
    isNested ? "px-3 py-2.5 text-sm" : "px-3.5 py-2.5 text-[0.95rem]",
    isHighlighted
      ? "bg-gradient-to-r from-[#0d8d67]/95 to-[#0a785a]/95 text-white shadow-[0_10px_24px_-12px_rgba(8,151,109,0.9)]"
      : "text-white/90 hover:bg-white/10 hover:text-white",
  ].join(" ");

  const iconClass = isNested ? "h-[16px] w-[16px]" : "h-[18px] w-[18px]";

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          className={baseClass}
          onClick={() => onToggleGroup(item.id)}
          aria-expanded={isExpanded}
          aria-controls={`sidebar-group-${item.id}`}
        >
          <Icon className={`${iconClass} shrink-0`} />
          <span className="truncate font-medium">{item.label}</span>
          <span className="ml-auto">
            <IconChevron expanded={isExpanded} />
          </span>
        </button>

        {isExpanded ? (
          <ul id={`sidebar-group-${item.id}`} className="mt-1.5 space-y-1.5 pl-6 border-l border-white/10 ml-3">
            {children.map((child) => (
              <SidebarNavItem
                key={child.id}
                item={child}
                pathname={pathname}
                expandedGroups={expandedGroups}
                onToggleGroup={onToggleGroup}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      <Link to={item.path ?? "/"} className={baseClass} onClick={onNavigate}>
        <Icon className={`${iconClass} shrink-0`} />
        <span className="truncate font-medium">{item.label}</span>
      </Link>
    </li>
  );
}
