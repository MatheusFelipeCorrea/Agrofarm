import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { DashboardContent } from "./Dashboard.jsx";

function renderDashboard(props) {
	return renderToStaticMarkup(
		<MemoryRouter>
			<DashboardContent {...props} />
		</MemoryRouter>,
	);
}

vi.mock("recharts", () => {
	const Box = ({ children }) => React.createElement("div", null, children);
	return {
		ResponsiveContainer: Box,
		PieChart: Box,
		Pie: Box,
		Cell: Box,
		Tooltip: Box,
	};
});

describe("DashboardContent", () => {
	it("renderiza estado de loading", () => {
		const html = renderDashboard({
			dashboardData: null,
			cotacaoData: null,
			isLoadingDashboard: true,
			isLoadingCotacao: true,
		});

		expect(html).toContain("Carregando recomenda");
		expect(html).toContain("Carregando producao");
		expect(html).toContain("Carregando extrato");
		expect(html).toContain("Carregando estoque");
	});

	it("renderiza dados principais", () => {
		const html = renderDashboard({
			dashboardData: {
				recomendacao: { texto: "Irrigar o talhao 2" },
				producaoPorCultura: [
					{ culturaId: "c1", nome: "Soja", cor: "#1f8f2f", sacas: 40 },
				],
				sacasEmEstoque: [
					{ culturaId: "c1", nome: "Soja", peso: 30, dataColheita: "2026-05-01" },
				],
				extratoRecente: [
					{
						id: "l1",
						tipo: "LUCRO",
						valor: 1000,
						data: "2026-05-01",
						titulo: "Venda Soja",
						descricao: "Venda",
						fazendaNome: "Fazenda 1",
						categoria: "Receita",
					},
				],
				cards: { saldoTotal: 800, lucroTotal: 1000, custosTotais: 200 },
			},
			cotacaoData: { valor: 5.45, fonte: "seed", atualizadoEm: "2026-05-01" },
			isLoadingDashboard: false,
			isLoadingCotacao: false,
		});

		expect(html).toContain("Irrigar o talhao 2");
		expect(html).toContain("Producao por Cultura");
		expect(html).toContain("Extrato recente");
		expect(html).toContain("Sacas em Estoque");
		expect(html).toContain("Soja");
		expect(html).toContain("Venda Soja");
	});

	it("renderiza estados vazios sem quebrar", () => {
		const html = renderDashboard({
			dashboardData: {
				recomendacao: null,
				producaoPorCultura: [],
				sacasEmEstoque: [],
				extratoRecente: [],
				cards: { saldoTotal: 0, lucroTotal: 0, custosTotais: 0, cotacaoAtual: null },
			},
			cotacaoData: null,
			isLoadingDashboard: false,
			isLoadingCotacao: false,
		});

		expect(html).toContain("Sem recomenda");
		expect(html).toContain("Sem dados de producao");
		expect(html).toContain("Sem dados de estoque");
		expect(html).toContain("Sem movimenta");
	});
});

