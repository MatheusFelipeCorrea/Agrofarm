import { Link } from "react-router-dom";
import { ChevronRightIcon } from "../../ui/icons.jsx";

/**
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 */
export default function Breadcrumbs({ items }) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-[var(--agro-brand)]/50" />
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate font-medium text-[var(--agro-brand)] transition-colors hover:text-[var(--agro-brand-hover)] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${isLast ? "font-semibold text-gray-800" : "font-medium text-[var(--agro-brand)]"}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
