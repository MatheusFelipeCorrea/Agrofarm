import SoftBadge from "../SoftBadge/SoftBadge.jsx";

/** @deprecated Prefira SoftBadge ou os badges de DomainBadges.jsx */
const VARIANT_TO_TONE = {
  success: "emerald",
  warning: "amber",
  danger: "red",
  default: "gray",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  return (
    <SoftBadge tone={VARIANT_TO_TONE[variant] ?? VARIANT_TO_TONE.default} className={className}>
      {children}
    </SoftBadge>
  );
}
