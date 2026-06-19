import SoftBadge from "../../components/ui/SoftBadge/SoftBadge.jsx";
import {
  BADGE_BASE,
  FAZENDA_ATIVA_TONE,
  fazendaTipoBadgeClass,
  getCulturaBadgeStylesVivid,
} from "../../lib/softBadge.js";

const TIPO_LABEL = {
  PROPRIA: "Própria",
  ARRENDADA_DE_TERCEIROS: "Arrendada",
  ARRENDADA_PARA_TERCEIROS: "Arrendada p/ Terceiros",
};

export function TipoBadge({ tipo }) {
  const label = TIPO_LABEL[tipo] ?? tipo;
  return <span className={[BADGE_BASE, fazendaTipoBadgeClass(tipo)].join(" ")}>{label}</span>;
}

export function AtivaBadge({ ativa, className = "" }) {
  const tone = ativa === false ? FAZENDA_ATIVA_TONE.inativa : FAZENDA_ATIVA_TONE.ativa;
  return (
    <SoftBadge tone={tone} className={className}>
      {ativa === false ? "Inativa" : "Ativa"}
    </SoftBadge>
  );
}

export function SomenteLeituraBadge({ className = "" }) {
  return (
    <SoftBadge tone="sky" className={className}>
      Somente leitura
    </SoftBadge>
  );
}

export function CulturaPill({ nome, cor, className = "", showDot = true }) {
  const styles = getCulturaBadgeStylesVivid(cor);
  return (
    <span className={[styles.className, className].filter(Boolean).join(" ")} style={styles.style}>
      {showDot ? (
        <span
          className="h-2 w-2 shrink-0 rounded-full ring-1 ring-current/20"
          style={{ backgroundColor: styles.dotColor }}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{nome}</span>
    </span>
  );
}
