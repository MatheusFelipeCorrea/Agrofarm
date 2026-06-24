import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Banknote,
	CheckCircle2,
	Clock,
	Lightbulb,
	Plus,
	Receipt,
	TrendingUp,
	Wallet,
} from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import MainLayout from "../../layouts/MainLayout.jsx";
import Select from "../../components/ui/Select/Select.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { listarCulturas } from "../../services/cultura/cultura.service.js";
import { useFazendaListQuery } from "../../queries/fazenda/useFazendaQueries.js";
import {
	useCalcularSacasMutation,
	useCotacaoSimulacaoQuery,
	useGetDividasSimulacao,
	usePré_carregarCotacoes,
	useSalvarSimulacaoMutation,
} from "../../queries/simulacao/useSimulacaoQueries.js";
import { formatBRL, formatNumberPtBR } from "../../utils/formatters.js";
import { SimulacaoHistoricoModal } from "./components/SimulacaoHistoricoModal.jsx";
import SimulacaoLinhaItem from "./components/SimulacaoLinhaItem.jsx";

const SELECT_CLS =
	"h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const MAX_PONTOS_GRAFICO = 24;

function criarLinhaVazia() {
	return {
		id: crypto.randomUUID(),
		culturaId: "",
		quantidadeSacas: "",
		valorSaca: "",
		isExportacao: true,
		moeda: "USD",
	};
}

function formatarDataHora(valorIso) {
	const data = new Date(valorIso);
	if (Number.isNaN(data.getTime())) return "--";
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(data);
}

function criarCambioDaCotacao(valorCotacao) {
	if (!Number.isFinite(valorCotacao) || valorCotacao <= 0) {
		return { usd: "1", brl: "" };
	}
	return { usd: "1", brl: String(valorCotacao.toFixed(4)) };
}

function labelPrimeiroPontoGrafico() {
	return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date());
}

function appendPontoHistorico(historicoMoeda, valorCotacao) {
	const label = historicoMoeda.length === 0 ? labelPrimeiroPontoGrafico() : "Hoje";
	const proximoPonto = { horario: label, valor: valorCotacao };
	const ultimo = historicoMoeda[historicoMoeda.length - 1];
	if (ultimo?.valor === proximoPonto.valor && ultimo?.horario === proximoPonto.horario) {
		return historicoMoeda;
	}
	return [...historicoMoeda, proximoPonto].slice(-MAX_PONTOS_GRAFICO);
}

function tooltipCotacao({ active, payload, label }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
			<p className="font-semibold text-slate-800">{label}</p>
			<p className="text-slate-600">{formatNumberPtBR(payload[0]?.value ?? 0, { maximumFractionDigits: 4 })}</p>
		</div>
	);
}

function MetricCard({ label, value, tone = "neutral", icon: Icon }) {
	const tones = {
		green: "border-emerald-100 bg-emerald-50 text-emerald-900",
		red: "border-rose-100 bg-rose-50 text-rose-900",
		neutral: "border-slate-200 bg-slate-50 text-slate-900",
	};
	return (
		<div className={`rounded-xl border p-4 ${tones[tone] ?? tones.neutral}`}>
			<div className="flex items-start justify-between gap-2">
				<p className="text-xs font-medium opacity-80">{label}</p>
				{Icon ? <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden /> : null}
			</div>
			<p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
		</div>
	);
}

function labelTipoVenda(linha) {
	if (!linha.isExportacao) return "Mercado interno";
	return linha.moeda === "EUR" ? "Exportação (EUR)" : "Exportação (USD)";
}

export default function Simulacao() {
	const usuario = useAuthStore((s) => s.usuario);
	const isAdmin = usuario?.role === "ADMIN";

	const [fazendaSimulacaoId, setFazendaSimulacaoId] = useState("todas");
	const [linhas, setLinhas] = useState([criarLinhaVazia()]);
	const [moedaCotacao, setMoedaCotacao] = useState("USD");
	const [cambioManual, setCambioManual] = useState({ USD: { usd: "1", brl: "" }, EUR: { usd: "1", brl: "" } });
	const [editouCambio, setEditouCambio] = useState({ USD: false, EUR: false });
	const historicoCotacaoRef = useRef({ USD: [], EUR: [] });
	const [resultadoAtual, setResultadoAtual] = useState(null);
	const [resultadoSalvo, setResultadoSalvo] = useState(false);
	const [simulacaoRestaurada, setSimulacaoRestaurada] = useState(false);
	const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);

	usePré_carregarCotacoes();

	const { data: culturas = [] } = useQuery({
		queryKey: ["simulacao", "culturas"],
		queryFn: listarCulturas,
		staleTime: 5 * 60_000,
		retry: 1,
		enabled: isAdmin,
	});

	const { data: fazendas = [] } = useFazendaListQuery({ enabled: isAdmin });

	const { data: cotacao, isLoading: cotacaoLoading } = useCotacaoSimulacaoQuery(moedaCotacao, {
		enabled: isAdmin,
		refetchInterval: 2 * 60 * 60 * 1000,
		refetchIntervalInBackground: true,
	});

	const { data: dividas, isLoading: dividasLoading } = useGetDividasSimulacao(fazendaSimulacaoId, {
		enabled: isAdmin,
	});

	const calcularMutation = useCalcularSacasMutation();
	const salvarMutation = useSalvarSimulacaoMutation();

	const valorCotacaoApi = Number(cotacao?.valor);

	useEffect(() => {
		if (!Number.isFinite(valorCotacaoApi) || valorCotacaoApi <= 0) return;
		const historicoAtual = historicoCotacaoRef.current[moedaCotacao] ?? [];
		const historicoAtualizado = appendPontoHistorico(historicoAtual, valorCotacaoApi);
		if (historicoAtualizado !== historicoAtual) {
			historicoCotacaoRef.current = { ...historicoCotacaoRef.current, [moedaCotacao]: historicoAtualizado };
		}
	}, [valorCotacaoApi, moedaCotacao]);

	const cambioDerivado = useMemo(() => criarCambioDaCotacao(valorCotacaoApi), [valorCotacaoApi]);
	const cambioExibido = editouCambio[moedaCotacao]
		? cambioManual[moedaCotacao]
		: cambioDerivado;

	const opcoesCultura = useMemo(
		() => (Array.isArray(culturas) ? culturas : []).map((c) => ({ id: c.id, nome: c.nome, cor: c.cor })),
		[culturas],
	);

	const fazendaLabel =
		fazendaSimulacaoId === "todas"
			? "Todas as fazendas"
			: fazendas.find((f) => f.id === fazendaSimulacaoId)?.nome ?? "Fazenda selecionada";

	const totalPendente = Number(dividas?.totalPendente ?? 0);
	const totalPago = Number(dividas?.totalPago ?? 0);
	const totalGasto = Number(dividas?.totalGasto ?? 0);
	const lucroRegistrado = Number(dividas?.lucroRegistrado ?? 0);
	const dividaAtual = Number(dividas?.totalDivida ?? totalPendente);
	const percentualPago = totalGasto > 0 ? (totalPago / totalGasto) * 100 : 0;
	const percentualPendente = totalGasto > 0 ? (totalPendente / totalGasto) * 100 : 0;

	const cotacaoExibida = Number(cambioExibido.brl) || Number(cotacao?.valor) || 0;
	const historicoMoedaAtual = historicoCotacaoRef.current[moedaCotacao] ?? [];
	const dadosGrafico = historicoMoedaAtual.length
		? historicoMoedaAtual
		: [{ horario: "Hoje", valor: cotacaoExibida }];
	const simboloMoeda = moedaCotacao === "EUR" ? "€" : "$";

	const linhasValidas = linhas.filter(
		(l) => l.culturaId && Number(l.quantidadeSacas) > 0 && Number(l.valorSaca) > 0,
	);

	function handleMoedaCotacaoChange(novaMoeda) {
		setMoedaCotacao(novaMoeda);
	}

	function handleCambioChange(moeda, campo, valor) {
		const cotacaoAtual = moeda === "EUR"
			? Number(historicoCotacaoRef.current.EUR?.slice(-1)[0]?.valor ?? cotacaoExibida)
			: Number(historicoCotacaoRef.current.USD?.slice(-1)[0]?.valor ?? cotacaoExibida);

		setEditouCambio((prev) => ({ ...prev, [moeda]: true }));

		if (campo === "usd") {
			const brlValue = valor && cotacaoAtual > 0 ? (Number(valor) * cotacaoAtual).toFixed(4) : "";
			setCambioManual((prev) => ({ ...prev, [moeda]: { usd: valor, brl: brlValue } }));
		} else {
			const usdValue = valor && cotacaoAtual > 0 ? (Number(valor) / cotacaoAtual).toFixed(4) : "";
			setCambioManual((prev) => ({ ...prev, [moeda]: { usd: usdValue, brl: valor } }));
		}
	}

	function atualizarLinha(id, patch) {
		setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
		setResultadoAtual(null);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
	}

	function adicionarLinha() {
		setLinhas((prev) => [...prev, criarLinhaVazia()]);
		setResultadoAtual(null);
		setResultadoSalvo(false);
	}

	function removerLinha(id) {
		setLinhas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
		setResultadoAtual(null);
		setResultadoSalvo(false);
	}

	function handleFazendaChange(novaFazenda) {
		setFazendaSimulacaoId(novaFazenda);
		setResultadoAtual(null);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
	}

	function handleLimparSimulacao() {
		setLinhas([criarLinhaVazia()]);
		setResultadoAtual(null);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
	}

	function montarPayloadCalculo() {
		const cambio = {};
		if (editouCambio.USD) {
			cambio.USD = {
				usd: Number(cambioManual.USD.usd),
				brl: Number(cambioManual.USD.brl),
			};
		}
		if (editouCambio.EUR) {
			cambio.EUR = {
				usd: Number(cambioManual.EUR.usd),
				brl: Number(cambioManual.EUR.brl),
			};
		}

		return {
			fazendaId: fazendaSimulacaoId,
			linhas: linhasValidas.map((l) => ({
				culturaId: l.culturaId,
				quantidadeSacas: Number(l.quantidadeSacas),
				valorSaca: Number(l.valorSaca),
				isExportacao: l.isExportacao,
				moeda: l.isExportacao ? (l.moeda === "EUR" ? "EUR" : "USD") : "BRL",
			})),
			...(Object.keys(cambio).length ? { cambio } : {}),
		};
	}

	async function handleSimular(event) {
		event.preventDefault();
		if (simulacaoRestaurada) {
			handleLimparSimulacao();
			return;
		}
		if (linhasValidas.length === 0) return;

		const resultado = await calcularMutation.mutateAsync(montarPayloadCalculo());
		setResultadoAtual(resultado);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
	}

	async function handleSalvarSimulacao() {
		if (!resultadoAtual?.linhas?.length) return;

		await salvarMutation.mutateAsync({
			...montarPayloadCalculo(),
			valorBruto: Number(resultadoAtual.resultado?.valorBruto ?? 0),
			valorLiquido: Number(resultadoAtual.resultado?.valorLiquido ?? 0),
			composicaoTaxas: resultadoAtual.composicaoTaxas,
			abatimentoDivida: Number(resultadoAtual.resultado?.abatimentoAplicado ?? 0),
			novoSaldoDivida: Number(resultadoAtual.resultado?.novoSaldoDivida ?? 0),
		});

		setResultadoSalvo(true);
	}

	function handleRestaurarSimulacao(simulacao) {
		const linhasSalvas = simulacao.composicaoTaxas?.linhas;
		if (Array.isArray(linhasSalvas) && linhasSalvas.length > 0) {
			setLinhas(
				linhasSalvas.map((item) => ({
					id: crypto.randomUUID(),
					culturaId: item.culturaId,
					quantidadeSacas: String(item.quantidadeSacas ?? ""),
					valorSaca: String(item.valorSaca ?? ""),
					isExportacao: item.isExportacao !== false,
					moeda: item.moeda === "EUR" ? "EUR" : item.isExportacao === false ? "BRL" : "USD",
				})),
			);
		} else {
			const exportacao = simulacao.composicaoTaxas?.isExportacao ?? simulacao.moeda !== "BRL";
			setLinhas([
				{
					id: crypto.randomUUID(),
					culturaId: simulacao.culturaId,
					quantidadeSacas: String(simulacao.quantidadeSacas),
					valorSaca: String(simulacao.valorSaca),
					isExportacao: exportacao,
					moeda: simulacao.moeda === "EUR" ? "EUR" : exportacao ? "USD" : "BRL",
				},
			]);
		}

		setFazendaSimulacaoId(simulacao.fazendaId ?? "todas");
		setSimulacaoRestaurada(true);
		setResultadoAtual({
			escopo: { tipo: "simulacao", fazendaId: simulacao.fazendaId },
			linhas: simulacao.composicaoTaxas?.linhas ?? [],
			resultado: {
				valorBruto: simulacao.valorBruto,
				taxasEImpostos: simulacao.valorBruto - simulacao.valorLiquido,
				valorLiquido: simulacao.valorLiquido,
				abatimentoAplicado: simulacao.abatimentoDivida,
				saldoAtualDivida: simulacao.novoSaldoDivida + simulacao.abatimentoDivida,
				novoSaldoDivida: simulacao.novoSaldoDivida,
				lucroSimuladoRestante: Math.max(simulacao.valorLiquido - simulacao.abatimentoDivida, 0),
			},
			lucro: {
				registrado: lucroRegistrado,
				restanteAposAbatimento: Math.max(simulacao.valorLiquido - simulacao.abatimentoDivida, 0),
			},
			composicaoTaxas: simulacao.composicaoTaxas || {},
			calculadoEm: simulacao.criadoEm,
		});
		setResultadoSalvo(true);
	}

	if (!isAdmin) {
		return (
			<MainLayout>
				<section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
					<h1 className="text-lg font-semibold text-amber-900">Acesso restrito</h1>
					<p className="mt-2 text-sm text-amber-800">A tela de Simulação está disponível apenas para usuários ADMIN.</p>
				</section>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="space-y-6" data-testid="simulacao-page">
				<header>
					<h1 className="text-3xl font-semibold text-slate-800">Simulação</h1>
					<p className="mt-1 text-sm text-slate-600">
						Monte cenários com várias culturas e tipos de venda para estimar abatimento da dívida e lucro restante.
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
					<div className="space-y-6">
						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-slate-800">Escopo</h2>
							<div className="mt-4">
								<Select
									label="Fazenda"
									value={fazendaSimulacaoId}
									onChange={(e) => handleFazendaChange(e.target.value)}
									selectClassName={SELECT_CLS}
									labelClassName="mb-1 block text-sm font-medium text-gray-700"
								>
									<option value="todas">Todas as fazendas</option>
									{fazendas.map((f) => (
										<option key={f.id} value={f.id}>{f.nome}</option>
									))}
								</Select>
								<p className="mt-2 text-xs text-slate-500">
									Dívida e lucro exibidos referem-se a: <strong>{fazendaLabel}</strong>
								</p>
							</div>
						</section>

						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-slate-800">Cotação</h2>
								<div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
									<button type="button" className={`rounded-md px-3 py-1 text-xs font-semibold ${moedaCotacao === "USD" ? "bg-[#114437] text-white" : "text-gray-600"}`} onClick={() => handleMoedaCotacaoChange("USD")}>Dólar</button>
									<button type="button" className={`rounded-md px-3 py-1 text-xs font-semibold ${moedaCotacao === "EUR" ? "bg-[#114437] text-white" : "text-gray-600"}`} onClick={() => handleMoedaCotacaoChange("EUR")}>Euro</button>
								</div>
							</div>
							<div className="h-[180px] w-full rounded-xl border border-slate-100 bg-slate-50/80 p-2">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={dadosGrafico} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
										<XAxis dataKey="horario" tick={{ fontSize: 11, fill: "#64748b" }} />
										<YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={["auto", "auto"]} tickFormatter={(v) => formatNumberPtBR(v, { maximumFractionDigits: 2 })} />
										<Tooltip content={tooltipCotacao} />
										<Line type="monotone" dataKey="valor" stroke="#1f8f62" strokeWidth={2.5} dot={{ r: 3, fill: "#1f8f62" }} isAnimationActive={false} />
									</LineChart>
								</ResponsiveContainer>
							</div>
							<div className="mt-3 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm">
								<span className="font-semibold">{moedaCotacao} {simboloMoeda}1,00</span>
								<span className="mx-2 text-slate-400">=</span>
								<span className="font-semibold text-[#114437]">BRL {formatBRL(cotacaoExibida)}</span>
							</div>
							<div className="mt-3 grid grid-cols-2 gap-2">
								<label className="text-xs text-slate-600">
									<span className="mb-1 block font-medium">{moedaCotacao}</span>
									<input type="number" min="0" step="0.0001" value={cambioExibido.usd} onChange={(e) => handleCambioChange(moedaCotacao, "usd", e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm" />
								</label>
								<label className="text-xs text-slate-600">
									<span className="mb-1 block font-medium">BRL</span>
									<input type="number" min="0" step="0.0001" value={cambioExibido.brl} onChange={(e) => handleCambioChange(moedaCotacao, "brl", e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm" />
								</label>
							</div>
							<p className="mt-3 text-center text-xs text-slate-500">
								{cotacaoLoading ? "Atualizando cotação..." : `Referência ${moedaCotacao} para linhas de exportação`}
							</p>
						</section>

						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-slate-800">Resumo financeiro</h2>
							<p className="mt-1 text-xs text-slate-500">{fazendaLabel}</p>

							<div className="mt-4 grid grid-cols-1 gap-3">
								<div className="flex items-center gap-3 rounded-xl border border-[#d7e6db] bg-[#f2f8f4] p-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#114437]/10 text-[#114437]">
										<Wallet className="h-5 w-5" />
									</div>
									<div>
										<p className="text-sm text-slate-600">Dívida pendente</p>
										<p className="text-2xl font-semibold text-[#114437]">
											{dividasLoading ? "Carregando..." : formatBRL(dividaAtual)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
										<TrendingUp className="h-5 w-5" />
									</div>
									<div>
										<p className="text-sm text-slate-600">Lucro registrado</p>
										<p className="text-xl font-semibold text-emerald-800">
											{dividasLoading ? "Carregando..." : formatBRL(lucroRegistrado)}
										</p>
									</div>
								</div>
							</div>

							<div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-200">
								<div className="h-full bg-[#18824f]" style={{ width: `${Math.min(100, percentualPago)}%` }} />
								<div className="h-full bg-[#d22f2f]" style={{ width: `${Math.min(100, percentualPendente)}%` }} />
							</div>
							<div className="mt-3 space-y-1 text-sm">
								<div className="flex justify-between text-[#18824f]"><span>Pago</span><span className="font-semibold">{formatBRL(totalPago)}</span></div>
								<div className="flex justify-between text-[#d22f2f]"><span>Pendente</span><span className="font-semibold">{formatBRL(totalPendente)}</span></div>
							</div>
						</section>
					</div>

					<div className="space-y-6">
						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-slate-800">Cenário de vendas</h2>
							<p className="mt-1 text-sm text-slate-600">Adicione quantas culturas e tipos de venda precisar.</p>

							<form className="mt-4 space-y-4" onSubmit={handleSimular}>
								{linhas.map((linha, index) => (
									<SimulacaoLinhaItem
										key={linha.id}
										linha={linha}
										index={index}
										opcoesCultura={opcoesCultura}
										podeRemover={linhas.length > 1}
										onChange={atualizarLinha}
										onRemove={removerLinha}
									/>
								))}

								<button
									type="button"
									onClick={adicionarLinha}
									className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#2e5b47]/40 px-4 py-2.5 text-sm font-semibold text-[#2e5b47] hover:bg-[#f1f8f4]"
								>
									<Plus className="h-4 w-4" />
									Adicionar cultura / venda
								</button>

								<button
									type="submit"
									className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg bg-[#0f5f44] px-6 text-sm font-semibold text-white hover:bg-[#0b4f39] disabled:opacity-60"
									disabled={simulacaoRestaurada ? false : calcularMutation.isPending || linhasValidas.length === 0}
								>
									{simulacaoRestaurada ? "Limpar" : calcularMutation.isPending ? "Simulando..." : "Simular cenário"}
								</button>
							</form>

							<div className="mt-5 flex gap-3 rounded-xl border border-[#d6eadf] bg-[#f1f8f4] p-4 text-sm text-[#205942]">
								<Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
								<div>
									<p className="font-semibold">Como funciona?</p>
									<p className="mt-1">Cada linha é uma venda independente. Exportação usa cotação USD/EUR; mercado interno fica em reais. O total líquido abate a dívida do escopo selecionado; o que sobrar vira lucro simulado.</p>
								</div>
							</div>
						</section>

						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-slate-800">Resultados</h2>
								<div className="flex items-center gap-2">
									<button type="button" onClick={() => setIsHistoricoModalOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#2e5b47] hover:bg-slate-50" title="Histórico">
										<Clock className="h-4 w-4" />
									</button>
									<button type="button" onClick={handleSalvarSimulacao} disabled={!resultadoAtual || resultadoSalvo || salvarMutation.isPending} className="inline-flex h-9 items-center rounded-lg bg-[#0f7f3b] px-4 text-sm font-semibold text-white disabled:opacity-40">
										{salvarMutation.isPending ? "Salvando..." : resultadoSalvo ? "Salva" : "Salvar"}
									</button>
								</div>
							</div>

							{!resultadoAtual ? (
								<p className="mt-6 text-sm text-slate-500">Execute uma simulação para visualizar os resultados.</p>
							) : (
								<>
									<p className="mt-2 text-xs text-slate-500">Escopo: {fazendaLabel}</p>

									<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
										<MetricCard label="Receita líquida simulada" value={formatBRL(resultadoAtual.resultado?.valorLiquido)} tone="green" icon={Banknote} />
										<MetricCard label="Abatimento na dívida" value={formatBRL(resultadoAtual.resultado?.abatimentoAplicado)} tone="green" icon={Receipt} />
										<MetricCard label="Dívida restante" value={formatBRL(resultadoAtual.resultado?.novoSaldoDivida)} tone="red" icon={Wallet} />
										<MetricCard label="Lucro após abatimento" value={formatBRL(resultadoAtual.resultado?.lucroSimuladoRestante ?? resultadoAtual.lucro?.restanteAposAbatimento)} tone="green" icon={TrendingUp} />
									</div>

									<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<MetricCard label="Lucro já registrado" value={formatBRL(resultadoAtual.lucro?.registrado ?? lucroRegistrado)} tone="neutral" icon={TrendingUp} />
										<MetricCard label="Lucro total projetado" value={formatBRL(resultadoAtual.lucro?.totalAposSimulacao ?? (lucroRegistrado + (resultadoAtual.resultado?.lucroSimuladoRestante ?? 0)))} tone="green" icon={CheckCircle2} />
									</div>

									{(resultadoAtual.linhas ?? []).length > 0 ? (
										<div className="mt-5 space-y-3">
											<h3 className="text-sm font-semibold text-slate-700">Detalhamento por venda</h3>
											{resultadoAtual.linhas.map((linha, idx) => (
												<div key={`${linha.cultura?.id}-${idx}`} className="rounded-xl border border-slate-200 p-4 text-sm">
													<div className="flex flex-wrap items-center justify-between gap-2">
														<p className="font-semibold text-slate-800">{linha.cultura?.nome ?? `Venda ${idx + 1}`}</p>
														<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{labelTipoVenda(linha)}</span>
													</div>
													<div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-4">
														<span>{formatNumberPtBR(linha.quantidadeSacas)} sc</span>
														<span>Líquido: {formatBRL(linha.resultado?.valorLiquido)}</span>
														<span>Bruto: {formatBRL(linha.resultado?.valorBruto)}</span>
														<span>Taxas: {formatBRL(linha.resultado?.taxasEImpostos)}</span>
													</div>
												</div>
											))}
										</div>
									) : null}

									<div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
										<table className="w-full border-collapse text-sm">
											<tbody>
												<tr className="border-b border-slate-100"><td className="px-4 py-3 text-slate-600">Valor bruto total</td><td className="px-4 py-3 text-right font-medium">{formatBRL(resultadoAtual.resultado?.valorBruto)}</td></tr>
												<tr className="border-b border-slate-100"><td className="px-4 py-3 text-slate-600">Taxas e custos</td><td className="px-4 py-3 text-right font-medium text-rose-700">- {formatBRL(resultadoAtual.resultado?.taxasEImpostos)}</td></tr>
												<tr className="border-b border-slate-100"><td className="px-4 py-3 text-slate-600">Valor líquido</td><td className="px-4 py-3 text-right font-medium text-emerald-700">{formatBRL(resultadoAtual.resultado?.valorLiquido)}</td></tr>
												<tr className="border-b border-slate-100"><td className="px-4 py-3 text-slate-600">Dívida antes</td><td className="px-4 py-3 text-right font-medium text-rose-700">{formatBRL(resultadoAtual.resultado?.saldoAtualDivida)}</td></tr>
												<tr className="border-b border-slate-100"><td className="px-4 py-3 text-slate-600">Abatimento aplicado</td><td className="px-4 py-3 text-right font-medium text-emerald-700">{formatBRL(resultadoAtual.resultado?.abatimentoAplicado)}</td></tr>
												<tr className="bg-[#edf6f1]"><td className="px-4 py-3 font-semibold text-[#205942]">Dívida restante</td><td className="px-4 py-3 text-right text-lg font-bold text-[#114437]">{formatBRL(resultadoAtual.resultado?.novoSaldoDivida)}</td></tr>
											</tbody>
										</table>
									</div>
								</>
							)}
						</section>
					</div>
				</div>
			</div>

			{isHistoricoModalOpen ? (
				<SimulacaoHistoricoModal
					onClose={() => setIsHistoricoModalOpen(false)}
					fazendaId={fazendaSimulacaoId}
					onRestaurar={handleRestaurarSimulacao}
				/>
			) : null}
		</MainLayout>
	);
}
