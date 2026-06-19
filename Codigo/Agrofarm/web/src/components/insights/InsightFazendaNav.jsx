import { ChevronLeft, ChevronRight } from "lucide-react";

export default function InsightFazendaNav({ indice, total, onAnterior, onProximo }) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Alternar visualização">
      <button
        type="button"
        onClick={onAnterior}
        disabled={indice <= 0}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#2e5b47] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Fazenda anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onProximo}
        disabled={indice >= total - 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#2e5b47] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Próxima fazenda"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
