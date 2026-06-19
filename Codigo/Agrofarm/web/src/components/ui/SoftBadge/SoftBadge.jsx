import { BADGE_BASE, toneClass } from "../../../lib/softBadge.js";

export default function SoftBadge({ children, tone = "gray", className = "", style }) {
  return (
    <span className={[BADGE_BASE, toneClass(tone), className].filter(Boolean).join(" ")} style={style}>
      {children}
    </span>
  );
}
