import { TrendingDown, TrendingUp } from "lucide-react";
import { splitTrechosAcao } from "../../utils/insightTextHighlight.js";
import InsightFazendaRodape from "./InsightFazendaRodape.jsx";

function TextoComDestaqueAcao({ texto, baseClassName }) {
  const partes = splitTrechosAcao(texto);

  return (
    <span className={baseClassName}>
      {partes.map((parte, index) =>
        parte.highlight ? (
          <span key={index} className="font-semibold text-emerald-700">
            {parte.text}
          </span>
        ) : (
          <span key={index}>{parte.text}</span>
        ),
      )}
    </span>
  );
}

export default function InsightFazendaLinha({ fazendaNome, destaque, tipo, exibirRodape = true }) {
  const isPositivo = tipo === "positivo";

  return (
    <div>
      <p
        className={`flex items-start gap-1.5 text-xs leading-relaxed ${
          isPositivo ? "text-gray-600" : "text-red-600"
        }`}
      >
        {isPositivo ? (
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <TextoComDestaqueAcao texto={destaque} />
      </p>
      {exibirRodape ? <InsightFazendaRodape nome={fazendaNome} /> : null}
    </div>
  );
}
