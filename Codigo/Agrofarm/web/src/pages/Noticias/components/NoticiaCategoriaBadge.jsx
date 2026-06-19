import SoftBadge from "../../../components/ui/SoftBadge/SoftBadge.jsx";
import { NOTICIA_CATEGORIA_TONE } from "../../../lib/softBadge.js";

export default function NoticiaCategoriaBadge({ categoria, className = "" }) {
  const cfg = NOTICIA_CATEGORIA_TONE[categoria] ?? { label: categoria, tone: "gray" };
  return (
    <SoftBadge tone={cfg.tone} className={className}>
      {cfg.label}
    </SoftBadge>
  );
}
