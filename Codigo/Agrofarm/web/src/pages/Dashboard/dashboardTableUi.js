/** Altura mínima do gráfico donut (alinha com a coluna da tabela). */
export const DASHBOARD_CHART_HEIGHT = 200;

/** Itens por página no card de extrato do dashboard. */
export const DASHBOARD_EXTRATO_PAGE_SIZE = 9;

/** Classes compartilhadas para alinhar altura visual das tabelas do dashboard com os gráficos. */
export const DASHBOARD_TABLE_CLASS =
  "min-w-0 w-full [&_th]:!py-3.5 [&_td]:!py-5 [&_tbody_tr]:min-h-[4.25rem] [&_td]:leading-relaxed";

/** Grid gráfico + tabela nas seções Produção e Estoque. */
export const DASHBOARD_PANEL_GRID_CLASS =
  "mt-3 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(160px,180px)_minmax(0,1fr)] lg:items-stretch";

/** Envolve a tabela para preencher a altura da célula ao lado do gráfico. */
export const DASHBOARD_PANEL_TABLE_SHELL_CLASS = "flex min-h-[12.5rem] flex-col";

/**
 * Tabela do extrato: preenche o espaço vertical disponível (--extrato-rows = itens na página).
 * Defina style={{ "--extrato-rows": N }} no AgroDataTable.
 */
export const DASHBOARD_EXTRATO_TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col [&>div:first-child]:flex-1 [&>div:first-child]:min-h-0 [&_table]:h-full [&_tbody]:h-full [&_tbody_tr]:min-h-[3.25rem] [&_tbody_tr]:h-[calc(100%/var(--extrato-rows,1))] [&_td]:!py-3.5 [&_th]:!py-2.5";
