import { Target, Trees } from "lucide-react";
import { formatBRL, formatNumberPtBR } from "../../utils/formatters.js";
import InsightMarkdown from "./InsightMarkdown.jsx";

function LinhaValor({ label, valor, corValor }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold tabular-nums ${corValor}`}>{valor}</span>
    </div>
  );
}

function LinhaEstoque({ cultura, sacas, cor }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-gray-800">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: cor ?? "#6b7280" }}
          aria-hidden
        />
        <span className="truncate" title={cultura || undefined}>
          {cultura}
        </span>
      </span>
      <span className="shrink-0 font-medium tabular-nums text-gray-900">
        {formatNumberPtBR(sacas)} sc
      </span>
    </div>
  );
}

export default function InsightFazendaDestaque({ fazenda, recomendacao }) {
  if (!fazenda) return null;

  const itens = fazenda.estoqueItens ?? [];

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-900">Gasto Atual:</p>
        <LinhaValor label="Pago:" valor={formatBRL(fazenda.totalPago)} corValor="text-emerald-600" />
        <LinhaValor label="Pendente:" valor={formatBRL(fazenda.totalPendente)} corValor="text-red-600" />
      </div>

      <hr className="border-gray-100" />

      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-900">Estoque Disponível</p>
        {itens.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhuma saca em estoque registrada.</p>
        ) : (
          itens.slice(0, 5).map((e) => (
            <LinhaEstoque
              key={e.cultura ?? e.nome}
              cultura={e.cultura ?? e.nome}
              sacas={e.sacas ?? e.emEstoque ?? 0}
              cor={e.cor}
            />
          ))
        )}
      </div>

      {recomendacao ? (
        <>
          <hr className="border-gray-100" />
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold text-[#2e5b47]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2e5b47] text-white">
                <Target className="h-3.5 w-3.5" aria-hidden />
              </span>
              Recomendação
            </p>
            <InsightMarkdown content={recomendacao} />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Componente Lucide para o cabeçalho do card (não usar função que retorna o ícone). */
export const InsightFazendaDestaqueIcon = Trees;
