import { LeafIcon } from "../ui/icons.jsx";
import { getCulturaBadgeStyles } from "../../lib/softBadge.js";

export default function CulturaIcon({ cultura, size = "md", className = "" }) {
  const sizes = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" };
  const iconSizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  const styles = getCulturaBadgeStyles(cultura?.cor);

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${sizes[size] ?? sizes.md} ${className}`}
      style={{
        backgroundColor: styles.style.backgroundColor,
        boxShadow: styles.style.boxShadow,
      }}
      title={cultura?.nome}
    >
      <LeafIcon
        className={iconSizes[size] ?? iconSizes.md}
        style={{ color: styles.dotColor }}
      />
    </span>
  );
}
