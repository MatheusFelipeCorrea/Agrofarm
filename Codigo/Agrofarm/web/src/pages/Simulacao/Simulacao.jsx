import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Banknote,
	CheckCircle2,
	Clock,
	Lightbulb,
	Receipt,
	Wallet,
} from "lucide-react";
import { FilterIcon } from "../../components/ui/icons.jsx";
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
import {
	useCalcularSacasMutation,
	useCotacaoSimulacaoQuery,
	useGetDividasSimulacao,
	usePré_carregarCotacoes,
	useSalvarSimulacaoMutation,
} from "../../queries/simulacao/useSimulacaoQueries.js";
import FieldTooltip from "../../components/ui/FieldTooltip/FieldTooltip.jsx";
import { formatBRL, formatNumberPtBR } from "../../utils/formatters.js";
import { SimulacaoHistoricoModal } from "./components/SimulacaoHistoricoModal.jsx";

const SELECT_CLS =
	"h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const MAX_PONTOS_GRAFICO = 24;
const TOOLTIP_CULTURA_OBRIGATORIA = "Selecione uma cultura antes de preencher este campo.";

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

function formatarLabelGrafico(horario) {
	if (horario === "Hoje") return "Hoje";
	const [h, m] = String(horario).split(":");
	if (h && m) return `${h}:${m}`;
	return horario;
}

function criarCambioDaCotacao(valorCotacao) {
	if (!Number.isFinite(valorCotacao) || valorCotacao <= 0) {
		return { usd: "1", brl: "" };
	}
	return { usd: "1", brl: String(valorCotacao.toFixed(4)) };
}

function labelPrimeiroPontoGrafico() {
	return formatarLabelGrafico(
		new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date()),
	);
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

export default function Simulacao() {
	const usuario = useAuthStore((s) => s.usuario);
	const fazendaSelecionada = useAuthStore((s) => s.fazendaSelecionada);
	const isAdmin = usuario?.role === "ADMIN";

	const [isExportacao, setIsExportacao] = useState(true);
	const [moeda, setMoeda] = useState("USD");
	const [form, setForm] = useState({ culturaId: "", quantidadeSacas: "", valorSaca: "" });
	const [cambioManual, setCambioManual] = useState({ usd: "1", brl: "" });
	const [editouCambio, setEditouCambio] = useState(false);
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

	const { data: cotacao, isLoading: cotacaoLoading } = useCotacaoSimulacaoQuery(moeda, {
		enabled: isAdmin && isExportacao,
		refetchInterval: 2 * 60 * 60 * 1000,
		refetchIntervalInBackground: true,
	});

	const { data: dividas, isLoading: dividasLoading } = useGetDividasSimulacao(fazendaSelecionada, {
		enabled: isAdmin,
	});

	const calcularMutation = useCalcularSacasMutation();
	const salvarMutation = useSalvarSimulacaoMutation();

	function handleMoedaChange(novaMoeda, { limparRestaurada = true } = {}) {
		if (novaMoeda === moeda) {
			if (limparRestaurada) setSimulacaoRestaurada(false);
			setEditouCambio(false);
			return;
		}
		setMoeda(novaMoeda);
		setEditouCambio(false);
		if (limparRestaurada) setSimulacaoRestaurada(false);
	}

	const valorCotacaoApi = Number(cotacao?.valor);

	useEffect(() => {
		if (!Number.isFinite(valorCotacaoApi) || valorCotacaoApi <= 0) return;
		const historicoAtual = historicoCotacaoRef.current[moeda] ?? [];
		const historicoAtualizado = appendPontoHistorico(historicoAtual, valorCotacaoApi);
		if (historicoAtualizado !== historicoAtual) {
			historicoCotacaoRef.current = { ...historicoCotacaoRef.current, [moeda]: historicoAtualizado };
		}
	}, [valorCotacaoApi, moeda]);

	const cambioDerivado = useMemo(
		() => criarCambioDaCotacao(valorCotacaoApi),
		[valorCotacaoApi],
	);

	const cambioExibido = editouCambio ? cambioManual : cambioDerivado;

	const opcoesCultura = useMemo(
		() =>
			(Array.isArray(culturas) ? culturas : []).map((cultura) => ({
				id: cultura.id,
				nome: cultura.nome,
				cor: cultura.cor,
			})),
		[culturas],
	);

	const culturaSelecionada = useMemo(
		() => opcoesCultura.find((item) => item.id === form.culturaId) ?? null,
		[opcoesCultura, form.culturaId],
	);

	const totaisFonte = dividas?.totais ?? dividas ?? {};
	const resumoGastos = {
		totalPago: Number(totaisFonte.totalPago ?? 0),
		totalPendente: Number(totaisFonte.totalPendente ?? 0),
		totalGasto: Number(totaisFonte.totalGasto ?? 0),
	};
	const dividaAtual = Number(totaisFonte.totalDivida ?? totaisFonte.totalPendente ?? 0);

	const percentualPago = resumoGastos.totalGasto > 0 ? (resumoGastos.totalPago / resumoGastos.totalGasto) * 100 : 0;
	const percentualPendente =
		resumoGastos.totalGasto > 0 ? (resumoGastos.totalPendente / resumoGastos.totalGasto) * 100 : 0;

	const cotacaoExibida = Number(cambioExibido.brl) || Number(cotacao?.valor) || 0;
	const historicoMoedaAtual = historicoCotacaoRef.current[moeda] ?? [];
	const dadosGrafico = historicoMoedaAtual.length
		? historicoMoedaAtual
		: [{ horario: "Hoje", valor: cotacaoExibida }];
	const simboloMoeda = moeda === "EUR" ? "€" : "$";
	const labelValorSaca = isExportacao
		? `Valor da saca (${moeda === "EUR" ? "EUR" : "USD"})`
		: "Valor da saca (R$)";
	const camposSacasBloqueados = !form.culturaId;
	const inputSacasBloqueadoCls = camposSacasBloqueados
		? "cursor-not-allowed bg-slate-50 text-slate-400 placeholder:text-slate-300"
		: "";

	function handleUSDChange(event) {
		const usdValue = event.target.value;
		const cotacaoAtual = Number(cotacao?.valor ?? 0);
		const brlValue = usdValue && cotacaoAtual > 0 ? (Number(usdValue) * cotacaoAtual).toFixed(4) : "";
		setEditouCambio(true);
		setCambioManual({ usd: usdValue, brl: brlValue });
	}

	function handleBRLChange(event) {
		const brlValue = event.target.value;
		const cotacaoAtual = Number(cotacao?.valor ?? 0);
		const usdValue = brlValue && cotacaoAtual > 0 ? (Number(brlValue) / cotacaoAtual).toFixed(4) : "";
		setEditouCambio(true);
		setCambioManual({ usd: usdValue, brl: brlValue });
	}

	function handleTipoVendaChange(exportacao) {
		if (exportacao === isExportacao) return;
		setIsExportacao(exportacao);
		setResultadoAtual(null);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
		setEditouCambio(false);
	}

	function handleLimparSimulacao() {
		setForm({ culturaId: "", quantidadeSacas: "", valorSaca: "" });
		setResultadoAtual(null);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
		setEditouCambio(false);
	}

	async function handleSimular(event) {
		event.preventDefault();

		if (simulacaoRestaurada) {
			handleLimparSimulacao();
			return;
		}

		const payload = {
			culturaId: form.culturaId || undefined,
			cultura: culturaSelecionada?.nome,
			quantidadeSacas: Number(form.quantidadeSacas),
			valorSaca: Number(form.valorSaca),
			isExportacao,
			moeda: isExportacao ? moeda : "BRL",
			fazendaId: fazendaSelecionada || "todas",
			...(isExportacao && editouCambio
				? { usd: Number(cambioManual.usd), brl: Number(cambioManual.brl) }
				: {}),
		};

		const resultado = await calcularMutation.mutateAsync(payload);
		setResultadoAtual(resultado);
		setResultadoSalvo(false);
		setSimulacaoRestaurada(false);
	}

	async function handleSalvarSimulacao() {
		if (!resultadoAtual?.cultura?.id) return;

		await salvarMutation.mutateAsync({
			fazendaId: resultadoAtual.escopo?.fazendaId || "todas",
			culturaId: resultadoAtual.cultura.id,
			quantidadeSacas: Number(resultadoAtual.quantidadeSacas ?? 0),
			valorSaca: Number(resultadoAtual.valorSaca ?? 0),
			isExportacao: resultadoAtual.isExportacao !== false,
			moeda: resultadoAtual.cotacao?.moeda || (resultadoAtual.isExportacao === false ? "BRL" : "USD"),
			taxaCambioManual:
				resultadoAtual.cotacao?.origem === "manual" ? Number(resultadoAtual.cotacao?.valorUsado ?? 0) : null,
			valorBruto: Number(resultadoAtual.resultado?.valorBruto ?? 0),
			valorLiquido: Number(resultadoAtual.resultado?.valorLiquido ?? 0),
			composicaoTaxas: resultadoAtual.composicaoTaxas,
			abatimentoDivida: Number(resultadoAtual.resultado?.abatimentoAplicado ?? 0),
			novoSaldoDivida: Number(resultadoAtual.resultado?.novoSaldoDivida ?? 0),
		});

		setResultadoSalvo(true);
	}

	function handleRestaurarSimulacao(simulacao) {
		const exportacaoRestaurada =
			simulacao.composicaoTaxas?.isExportacao ??
			(simulacao.moeda !== "BRL");
		const moedaRestaurada = simulacao.moeda === "EUR" ? "EUR" : "USD";
		setIsExportacao(exportacaoRestaurada);
		setForm({
			culturaId: simulacao.culturaId,
			quantidadeSacas: String(simulacao.quantidadeSacas),
			valorSaca: String(simulacao.valorSaca),
		});
		handleMoedaChange(moedaRestaurada, { limparRestaurada: false });
		setSimulacaoRestaurada(true);
		setResultadoAtual({
			escopo: { tipo: "simulacao", fazendaId: simulacao.fazendaId },
			isExportacao: exportacaoRestaurada,
			cultura: { id: simulacao.culturaId, nome: simulacao.cultura },
			quantidadeSacas: simulacao.quantidadeSacas,
			valorSaca: simulacao.valorSaca,
			cotacao: { moeda: simulacao.moeda, valorAtual: 0, valorUsado: 0, indiceAplicado: 1, origem: "historico" },
			resultado: {
				valorBruto: simulacao.valorBruto,
				taxasEImpostos: simulacao.valorBruto - simulacao.valorLiquido,
				valorLiquido: simulacao.valorLiquido,
				abatimentoAplicado: simulacao.abatimentoDivida,
				saldoAtualDivida: simulacao.novoSaldoDivida + simulacao.abatimentoDivida,
				novoSaldoDivida: simulacao.novoSaldoDivida,
				percentualAbatimento: 0,
			},
			composicaoTaxas: simulacao.composicaoTaxas || { percentual: 0, itens: [] },
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
						Realize as simulações para abatimento da sua dívida atual.
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
					{/* Coluna esquerda */}
					<div className="space-y-6">
						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-slate-800">Cotação</h2>
								{isExportacao ? (
								<div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
									<button
										type="button"
										className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
											moeda === "USD" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
										}`}
										onClick={() => handleMoedaChange("USD")}
									>
										Dólar
									</button>
									<button
										type="button"
										className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
											moeda === "EUR" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
										}`}
										onClick={() => handleMoedaChange("EUR")}
									>
										Euro
									</button>
								</div>
								) : (
									<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
										Mercado interno
									</span>
								)}
							</div>

							{!isExportacao ? (
								<p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
									Venda no mercado interno em reais. A cotação cambial não entra no cálculo.
								</p>
							) : (
							<>
							<div className="h-[200px] w-full rounded-xl border border-slate-100 bg-slate-50/80 p-2">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={dadosGrafico} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
										<XAxis dataKey="horario" tick={{ fontSize: 11, fill: "#64748b" }} />
										<YAxis
											tick={{ fontSize: 11, fill: "#64748b" }}
											domain={["auto", "auto"]}
											tickFormatter={(v) => formatNumberPtBR(v, { maximumFractionDigits: 2 })}
										/>
										<Tooltip content={tooltipCotacao} />
										<Line
											type="monotone"
											dataKey="valor"
											stroke="#1f8f62"
											strokeWidth={2.5}
											dot={{ r: 3, fill: "#1f8f62" }}
											activeDot={{ r: 5 }}
											isAnimationActive={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>

							<div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-700">
								<span className="font-semibold text-slate-800">
									{moeda} {simboloMoeda}1,00
								</span>
								<span className="mx-2 text-slate-400">=</span>
								<span className="font-semibold text-[#114437]">BRL {formatBRL(cotacaoExibida)}</span>
							</div>

							<div className="mt-3 grid grid-cols-2 gap-2">
								<label className="text-xs text-slate-600">
									<span className="mb-1 block font-medium">{moeda}</span>
									<input
										type="number"
										min="0"
										step="0.0001"
										value={cambioExibido.usd}
										onChange={handleUSDChange}
										className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm"
									/>
								</label>
								<label className="text-xs text-slate-600">
									<span className="mb-1 block font-medium">BRL</span>
									<input
										type="number"
										min="0"
										step="0.0001"
										value={cambioExibido.brl}
										onChange={handleBRLChange}
										className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm"
									/>
								</label>
							</div>

							<p className="mt-3 text-center text-xs text-slate-500">
								{cotacaoLoading
									? "Atualizando cotação..."
									: `Atualizado em ${cotacao?.atualizadoEm ? formatarDataHora(cotacao.atualizadoEm) : formatarDataHora(new Date().toISOString())}`}
							</p>
							</>
							)}
						</section>

						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-slate-800">Resumo da dívida</h2>

							<div className="mt-4 flex items-center gap-3 rounded-xl border border-[#d7e6db] bg-[#f2f8f4] p-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#114437]/10 text-[#114437]">
									<Wallet className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm text-slate-600">Dívida atual</p>
									<p className="text-2xl font-semibold text-[#114437]">
										{dividasLoading ? "Carregando..." : formatBRL(dividaAtual)}
									</p>
								</div>
							</div>

							<p className="mt-4 text-sm text-slate-700">
								Total gasto:{" "}
								<span className="font-semibold text-[#be2f2f]">
									{dividasLoading ? "—" : formatBRL(resumoGastos.totalGasto)}
								</span>
							</p>

							<div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full bg-[#18824f] transition-all"
									style={{ width: `${Math.min(100, Math.max(0, percentualPago))}%` }}
								/>
								<div
									className="h-full bg-[#d22f2f] transition-all"
									style={{ width: `${Math.min(100, Math.max(0, percentualPendente))}%` }}
								/>
							</div>

							<div className="mt-4 space-y-2 text-sm">
								<div className="flex items-center justify-between text-[#18824f]">
									<span className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-[#18824f]" />
										Pago
									</span>
									<span className="font-semibold">
										{formatBRL(resumoGastos.totalPago)} ({formatNumberPtBR(percentualPago, { maximumFractionDigits: 2 })}%)
									</span>
								</div>
								<div className="flex items-center justify-between text-[#d22f2f]">
									<span className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-[#d22f2f]" />
										Pendente
									</span>
									<span className="font-semibold">
										{formatBRL(resumoGastos.totalPendente)} (
										{formatNumberPtBR(percentualPendente, { maximumFractionDigits: 2 })}%)
									</span>
								</div>
							</div>

							<p className="mt-4 text-xs text-slate-500">
								Data de referência: {formatarDataHora(new Date().toISOString()).split(",")[0]}
							</p>
						</section>
					</div>

					{/* Coluna direita */}
					<div className="space-y-6">
						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-slate-800">Simulação</h2>
								{isExportacao ? (
									<div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
										<button
											type="button"
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
												moeda === "USD" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
											}`}
											onClick={() => handleMoedaChange("USD")}
										>
											Dólar (USD)
										</button>
										<button
											type="button"
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
												moeda === "EUR" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
											}`}
											onClick={() => handleMoedaChange("EUR")}
										>
											Euro (EUR)
										</button>
									</div>
								) : null}
							</div>

							<form className="mt-4 space-y-4" onSubmit={handleSimular}>
								<div>
									<p className="mb-2 text-sm font-medium text-gray-700">Tipo de venda</p>
									<div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 sm:w-auto">
										<button
											type="button"
											className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
												isExportacao ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
											}`}
											onClick={() => handleTipoVendaChange(true)}
										>
											Exportação
										</button>
										<button
											type="button"
											className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
												!isExportacao ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
											}`}
											onClick={() => handleTipoVendaChange(false)}
										>
											Mercado interno
										</button>
									</div>
								</div>
								<Select
									label="Selecione uma cultura"
									value={form.culturaId}
									onChange={(event) => {
										const culturaId = event.target.value;
										setForm((prev) => ({
											...prev,
											culturaId,
											...(culturaId ? {} : { quantidadeSacas: "", valorSaca: "" }),
										}));
									}}
									selectClassName={SELECT_CLS}
									labelClassName="mb-1 block text-sm font-medium text-gray-700"
								>
									<option value="">Selecione</option>
									{opcoesCultura.map((cultura) => (
										<option key={cultura.id} value={cultura.id}>
											{cultura.nome}
										</option>
									))}
								</Select>

								{culturaSelecionada ? (
									<p className="-mt-2 flex items-center gap-2 text-xs text-slate-600">
										<span
											className="inline-block h-2.5 w-2.5 rounded-full"
											style={{ backgroundColor: culturaSelecionada.cor || "#2e5b47" }}
										/>
										{culturaSelecionada.nome}
									</p>
								) : null}

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<label className="text-sm text-slate-700">
										<span className="mb-1 block font-medium">Quantidade de sacas</span>
										<FieldTooltip message={TOOLTIP_CULTURA_OBRIGATORIA} active={camposSacasBloqueados}>
											<div className="relative">
												<input
													type="number"
													min="0"
													step="0.01"
													value={form.quantidadeSacas}
													readOnly={camposSacasBloqueados}
													tabIndex={camposSacasBloqueados ? 0 : undefined}
													onChange={(event) => {
														if (camposSacasBloqueados) return;
														setForm((prev) => ({ ...prev, quantidadeSacas: event.target.value }));
													}}
													className={`h-10 w-full rounded-lg border border-gray-200 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20 ${inputSacasBloqueadoCls}`}
													placeholder="0"
													required
													aria-disabled={camposSacasBloqueados}
												/>
												<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
													sc
												</span>
											</div>
										</FieldTooltip>
									</label>

									<label className="text-sm text-slate-700">
										<span className="mb-1 block font-medium">{labelValorSaca}</span>
										<FieldTooltip message={TOOLTIP_CULTURA_OBRIGATORIA} active={camposSacasBloqueados}>
											<input
												type="number"
												min="0"
												step="0.01"
												value={form.valorSaca}
												readOnly={camposSacasBloqueados}
												tabIndex={camposSacasBloqueados ? 0 : undefined}
												onChange={(event) => {
													if (camposSacasBloqueados) return;
													setForm((prev) => ({ ...prev, valorSaca: event.target.value }));
												}}
												className={`h-10 w-full rounded-lg border border-gray-200 px-3 text-sm shadow-sm focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20 ${inputSacasBloqueadoCls}`}
												placeholder="0,00"
												required
												aria-disabled={camposSacasBloqueados}
											/>
										</FieldTooltip>
									</label>
								</div>

								<button
									type="submit"
									className={`inline-flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
										simulacaoRestaurada
											? "bg-[#2e5b47] hover:bg-[#254a3a]"
											: "bg-[#0f5f44] hover:bg-[#0b4f39]"
									}`}
									disabled={simulacaoRestaurada ? false : calcularMutation.isPending || !form.culturaId}
								>
									{simulacaoRestaurada ? (
										<>
											<FilterIcon className="h-3.5 w-3.5 shrink-0" />
											Limpar
										</>
									) : calcularMutation.isPending ? (
										"Simulando..."
									) : (
										"Simular"
									)}
								</button>
							</form>

							<div className="mt-5 flex gap-3 rounded-xl border border-[#d6eadf] bg-[#f1f8f4] p-4 text-sm text-[#205942]">
								<Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#2e5b47]" aria-hidden />
								<div>
									<p className="font-semibold">Como funciona?</p>
									<p className="mt-1 text-[#2d5a47]">
										Informe a cultura, a quantidade de sacas e o valor unitário. Em exportação, o valor da saca é
										convertido pela cotação cambial; no mercado interno, o cálculo permanece em reais. O sistema
										desconta taxas estimadas conforme o tipo de venda e mostra quanto da dívida pendente pode ser abatido.
									</p>
								</div>
							</div>
						</section>

						<section className="rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-slate-800">Resultados da simulação</h2>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setIsHistoricoModalOpen(true)}
										className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#2e5b47] hover:bg-slate-50"
										title="Histórico de simulações"
									>
										<Clock className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={handleSalvarSimulacao}
										disabled={!resultadoAtual || resultadoSalvo || salvarMutation.isPending || !resultadoAtual?.cultura?.id}
										className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0f7f3b] px-4 text-sm font-semibold text-white hover:bg-[#0d6f34] disabled:cursor-not-allowed disabled:opacity-40"
									>
										{salvarMutation.isPending ? "Salvando..." : resultadoSalvo ? "Simulação salva" : "Salvar simulação"}
									</button>
								</div>
							</div>

							{!resultadoAtual ? (
								<p className="mt-6 text-sm text-slate-500">Execute uma simulação para visualizar os resultados.</p>
							) : (
								<>
									<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
										<MetricCard
											label="Valor bruto da venda"
											value={formatBRL(resultadoAtual.resultado.valorBruto)}
											tone="green"
											icon={Banknote}
										/>
										<MetricCard
											label="Taxas e custos"
											value={`- ${formatBRL(resultadoAtual.resultado.taxasEImpostos)}`}
											tone="red"
											icon={Receipt}
										/>
										<MetricCard
											label="Valor líquido"
											value={formatBRL(resultadoAtual.resultado.valorLiquido)}
											tone="green"
											icon={Wallet}
										/>
										<MetricCard
											label="Novo saldo da dívida"
											value={formatBRL(resultadoAtual.resultado.novoSaldoDivida)}
											tone="green"
											icon={CheckCircle2}
										/>
									</div>

									<div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
										<table className="w-full border-collapse text-sm">
											<tbody>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Quantidade de sacas</td>
													<td className="px-4 py-3 text-right font-medium text-slate-800">
														{formatNumberPtBR(resultadoAtual.quantidadeSacas)} sc
													</td>
												</tr>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Tipo de venda</td>
													<td className="px-4 py-3 text-right font-medium text-slate-800">
														{resultadoAtual.isExportacao === false ? "Mercado interno" : "Exportação"}
													</td>
												</tr>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Valor da saca</td>
													<td className="px-4 py-3 text-right font-medium text-slate-800">
														{resultadoAtual.isExportacao === false
															? formatBRL(resultadoAtual.valorSaca)
															: `${formatNumberPtBR(resultadoAtual.valorSaca)} ${resultadoAtual.cotacao?.moeda ?? moeda}`}
													</td>
												</tr>
												{resultadoAtual.isExportacao !== false ? (
													<tr className="border-b border-slate-100">
														<td className="px-4 py-3 text-slate-600">Cotação aplicada</td>
														<td className="px-4 py-3 text-right font-medium text-slate-800">
															{formatBRL(resultadoAtual.cotacao?.valorUsado ?? resultadoAtual.cotacao?.valorAtual ?? 0)}
														</td>
													</tr>
												) : null}
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Valor bruto da venda</td>
													<td className="px-4 py-3 text-right font-medium text-emerald-700">
														{formatBRL(resultadoAtual.resultado.valorBruto)}
													</td>
												</tr>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Taxas e custos estimados</td>
													<td className="px-4 py-3 text-right font-medium text-rose-700">
														- {formatBRL(resultadoAtual.resultado.taxasEImpostos)}
													</td>
												</tr>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Valor líquido da venda</td>
													<td className="px-4 py-3 text-right font-medium text-emerald-700">
														{formatBRL(resultadoAtual.resultado.valorLiquido)}
													</td>
												</tr>
												<tr className="border-b border-slate-100">
													<td className="px-4 py-3 text-slate-600">Saldo atual da dívida</td>
													<td className="px-4 py-3 text-right font-medium text-rose-700">
														- {formatBRL(resultadoAtual.resultado.saldoAtualDivida)}
													</td>
												</tr>
												<tr className="bg-[#edf6f1]">
													<td className="px-4 py-3 font-semibold text-[#205942]">Novo saldo da dívida</td>
													<td className="px-4 py-3 text-right text-lg font-bold text-[#114437]">
														{formatBRL(resultadoAtual.resultado.novoSaldoDivida)}
													</td>
												</tr>
											</tbody>
										</table>
									</div>

									<p className="mt-4 text-xs leading-relaxed text-slate-500">
										{resultadoAtual.isExportacao === false
											? resultadoAtual.composicaoTaxas?.fonte?.includes("ibpt")
												? `Tributos de mercado interno com base IBPT (NCM ${resultadoAtual.composicaoTaxas?.ncm ?? "—"}, UF ${resultadoAtual.composicaoTaxas?.uf ?? "—"}), sem corretagem de exportação. `
												: "Taxas estimadas para mercado interno (impostos federais, ICMS e frete/armazenagem). "
											: resultadoAtual.composicaoTaxas?.fonte?.startsWith("ibpt")
												? `Tributos com base IBPT (NCM ${resultadoAtual.composicaoTaxas?.ncm ?? "—"}, UF ${resultadoAtual.composicaoTaxas?.uf ?? "—"}), mais corretagem e logística estimadas. `
												: "Taxas estimadas internamente (corretagem, impostos e logística). "}
										Os valores são indicativos e podem variar conforme a negociação real.
									</p>
								</>
							)}
						</section>
					</div>
				</div>
			</div>

			{isHistoricoModalOpen ? (
				<SimulacaoHistoricoModal
					onClose={() => setIsHistoricoModalOpen(false)}
					fazendaId={fazendaSelecionada || "todas"}
					onRestaurar={handleRestaurarSimulacao}
				/>
			) : null}
		</MainLayout>
	);
}
