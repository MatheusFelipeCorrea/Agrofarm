import { formatBRL, formatDateBR, formatNumberPtBR } from "../../../utils/formatters.js";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" };

/** Carteira — Saldo Total */
function IconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <path d="M20 12V8H6a2 2 0 01-2-2 2 2 0 012-2h12v4" />
      <path d="M4 6v12a2 2 0 002 2h14v-4" />
      <path d="M18 12a2 2 0 000 4h4v-4z" />
    </svg>
  );
}

/** Cifrão — Cotação */
function IconDollar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 000 4h4a2 2 0 010 4H8" />
      <line x1="12" y1="6" x2="12" y2="18" />
    </svg>
  );
}

/** Tendência de alta — Lucro */
function IconTrendingUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/** Tendência de baixa — Custos */
function IconTrendingDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

const ICONS = {
  wallet: <IconWallet />,
  dollar: <IconDollar />,
  "trending-up": <IconTrendingUp />,
  "trending-down": <IconTrendingDown />,
};

function Card({ titulo, valor, loading, destaque = "text-slate-800", icon = "wallet" }) {
  return (
    <article className="flex min-h-[84px] items-center rounded-2xl border border-[var(--agro-card-border)] bg-white px-4 shadow-sm">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p
            className={`mt-2 truncate text-[17px] font-semibold leading-none sm:text-[18px] ${loading ? "text-slate-500" : destaque}`}
            title={typeof valor === "string" ? valor : undefined}
          >
            {loading ? "..." : valor}
          </p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f5649] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          {ICONS[icon] ?? ICONS.wallet}
        </span>
      </div>
    </article>
  );
}

function formatarCotacao(cotacaoAtual) {
  if (!cotacaoAtual || cotacaoAtual.valor == null) {
    return { valor: "-", atualizado: null };
  }

  return {
    valor: `R$ ${formatNumberPtBR(cotacaoAtual.valor, { maximumFractionDigits: 2 })}`,
    atualizado: cotacaoAtual.atualizadoEm ? formatDateBR(cotacaoAtual.atualizadoEm) : null,
  };
}

export default function DashboardCards({ cards, cotacaoAtual, loadingCards, loadingCotacao }) {
  const cotacao = formatarCotacao(cotacaoAtual);

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="dashboard-cards"
    >
      <Card titulo="Saldo Total" valor={formatBRL(cards.saldoTotal)} loading={loadingCards} icon="wallet" />
      <Card titulo="Cotação" valor={cotacao.valor} loading={loadingCotacao} icon="dollar" />
      <Card titulo="Lucro" valor={formatBRL(cards.lucroTotal)} loading={loadingCards} destaque="text-emerald-700" icon="trending-up" />
      <Card titulo="Custos" valor={formatBRL(cards.custosTotais)} loading={loadingCards} destaque="text-red-700" icon="trending-down" />
    </section>
  );
}
