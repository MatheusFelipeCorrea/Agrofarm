import { AlertTriangleIcon, HandshakeIcon, SackIcon } from "../ui/icons.jsx";
import { formatNumberPtBR } from "../../utils/formatters.js";

function Card({ title, value, suffix, icon, tone }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
      <IconCircle tone={tone}>{icon}</IconCircle>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className={`text-[1.7rem] font-semibold leading-tight tracking-tight ${tone.text}`}>
          {formatNumberPtBR(value, { maximumFractionDigits: 0 })}
          {suffix ? <span className="ml-1 text-base font-medium text-gray-500">{suffix}</span> : null}
        </p>
      </div>
    </article>
  );
}

function IconCircle({ tone, children }) {
  return <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone.bg}`}>{children}</div>;
}

export default function EstoqueSummaryCards({ resumo }) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card
        title="Total em estoque"
        value={resumo?.totalEmEstoque ?? 0}
        suffix="sacas"
        tone={{ bg: "bg-green-50", text: "text-green-700" }}
        icon={<SackIcon className="h-5 w-5 text-green-600" />}
      />
      <Card
        title="Já vendido"
        value={resumo?.totalVendido ?? 0}
        suffix="sacas"
        tone={{ bg: "bg-blue-50", text: "text-blue-700" }}
        icon={<HandshakeIcon className="h-5 w-5 text-blue-600" />}
      />
      <Card
        title="Lotes com estoque baixo"
        value={resumo?.lotesEstoqueBaixo ?? 0}
        suffix="lotes"
        tone={{ bg: "bg-amber-50", text: "text-amber-600" }}
        icon={<AlertTriangleIcon className="h-5 w-5 text-amber-500" />}
      />
    </section>
  );
}
