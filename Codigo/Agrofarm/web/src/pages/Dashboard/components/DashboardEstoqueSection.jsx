import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AgroDataTableFooter from "../../../components/ui/DataTable/AgroDataTableFooter.jsx";
import {
  AgroDataTable,
  AgroDataTableBody,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
} from "../../../components/ui/DataTable/AgroDataTable.jsx";
import { formatDateBR, formatNumberPtBR } from "../../../utils/formatters.js";
import {
  DASHBOARD_CHART_HEIGHT,
  DASHBOARD_PANEL_GRID_CLASS,
  DASHBOARD_PANEL_TABLE_SHELL_CLASS,
  DASHBOARD_TABLE_CLASS,
} from "../dashboardTableUi.js";

const PAGE_SIZE = 5;

function mapearComPercentual(sacasEmEstoque) {
  const total = sacasEmEstoque.reduce((acc, item) => acc + Number(item.peso ?? 0), 0);
  return sacasEmEstoque.map((item) => ({
    ...item,
    percentual: total > 0 ? Number((((Number(item.peso ?? 0) * 100) / total).toFixed(2))) : 0,
  }));
}

function TooltipEstoque({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-800">{item.nome}</p>
      <p className="text-slate-600">Peso: {formatNumberPtBR(item.peso)} bag</p>
      <p className="text-slate-600">Colheita: {formatDateBR(item.dataColheita)}</p>
      <p className="text-slate-600">{formatNumberPtBR(item.percentual, { maximumFractionDigits: 2 })}% do estoque</p>
    </div>
  );
}

export default function DashboardEstoqueSection({ sacasEmEstoque, loading, className = "" }) {
  const dados = mapearComPercentual(sacasEmEstoque);
  const [page, setPage] = useState(1);

  const totalItems = dados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedDados = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return dados.slice(start, start + PAGE_SIZE);
  }, [dados, currentPage]);

  const start = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <section
      className={`flex flex-col rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm ${className}`.trim()}
      data-testid="dashboard-estoque"
    >
      <h2 className="shrink-0 text-xl font-semibold leading-tight text-slate-800 sm:text-[22px]">
        Sacas em Estoque
      </h2>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Carregando estoque...</p>
      ) : dados.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sem dados de estoque.</p>
      ) : (
        <div className={DASHBOARD_PANEL_GRID_CLASS}>
          <div className="mx-auto flex w-full max-w-[180px] items-center justify-center lg:mx-0 lg:min-h-[12.5rem]">
            <ResponsiveContainer width="100%" height={DASHBOARD_CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={dados}
                  dataKey="peso"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  innerRadius={46}
                  labelLine={false}
                >
                  {dados.map((item) => (
                    <Cell key={item.culturaId || item.nome} fill={item.cor || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipEstoque />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={DASHBOARD_PANEL_TABLE_SHELL_CLASS}>
          <AgroDataTable
            embedded
            className={DASHBOARD_TABLE_CLASS}
            minWidth={0}
            footer={
              <AgroDataTableFooter
                className="w-full"
                start={start}
                end={end}
                totalItems={totalItems}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            }
          >
            <AgroDataTableHead>
              <AgroDataTableTh align="left">Cultura</AgroDataTableTh>
              <AgroDataTableTh align="left">Peso</AgroDataTableTh>
              <AgroDataTableTh align="left">Data Colheita</AgroDataTableTh>
            </AgroDataTableHead>
            <AgroDataTableBody>
              {pagedDados.map((item) => (
                <AgroDataTableRow key={item.culturaId || item.nome}>
                  <AgroDataTableTd align="left" className="overflow-hidden">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.cor || "#94a3b8" }}
                      />
                      <span className="truncate" title={item.nome}>
                        {item.nome}
                      </span>
                    </span>
                  </AgroDataTableTd>
                  <AgroDataTableTd align="left" className="whitespace-nowrap font-semibold">
                    {formatNumberPtBR(item.peso)} bag
                  </AgroDataTableTd>
                  <AgroDataTableTd align="left" className="whitespace-nowrap font-semibold">
                    {formatDateBR(item.dataColheita)}
                  </AgroDataTableTd>
                </AgroDataTableRow>
              ))}
            </AgroDataTableBody>
          </AgroDataTable>
          </div>
        </div>
      )}
    </section>
  );
}
