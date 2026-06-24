import { Trash2 } from "lucide-react";
import Select from "../../../components/ui/Select/Select.jsx";
import FieldTooltip from "../../../components/ui/FieldTooltip/FieldTooltip.jsx";

const SELECT_CLS =
	"h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const TOOLTIP_CULTURA = "Selecione uma cultura antes de preencher este campo.";

export default function SimulacaoLinhaItem({
	linha,
	index,
	opcoesCultura,
	podeRemover,
	onChange,
	onRemove,
}) {
	const camposBloqueados = !linha.culturaId;
	const inputBloqueadoCls = camposBloqueados
		? "cursor-not-allowed bg-slate-50 text-slate-400 placeholder:text-slate-300"
		: "";
	const labelValor = linha.isExportacao
		? `Valor da saca (${linha.moeda === "EUR" ? "EUR" : "USD"})`
		: "Valor da saca (R$)";

	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-sm font-semibold text-slate-700">Venda {index + 1}</p>
				{podeRemover ? (
					<button
						type="button"
						onClick={() => onRemove(linha.id)}
						className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
						title="Remover linha"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				) : null}
			</div>

			<div className="space-y-3">
				<Select
					label="Cultura"
					value={linha.culturaId}
					onChange={(event) => onChange(linha.id, { culturaId: event.target.value })}
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

				<div>
					<p className="mb-2 text-sm font-medium text-gray-700">Tipo de venda</p>
					<div className="inline-flex w-full rounded-lg border border-gray-200 bg-white p-1">
						<button
							type="button"
							className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
								linha.isExportacao ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
							}`}
							onClick={() => onChange(linha.id, { isExportacao: true, moeda: linha.moeda || "USD" })}
						>
							Exportação
						</button>
						<button
							type="button"
							className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
								!linha.isExportacao ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
							}`}
							onClick={() => onChange(linha.id, { isExportacao: false, moeda: "BRL" })}
						>
							Mercado interno
						</button>
					</div>
				</div>

				{linha.isExportacao ? (
					<div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
						<button
							type="button"
							className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
								linha.moeda !== "EUR" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
							}`}
							onClick={() => onChange(linha.id, { moeda: "USD" })}
						>
							USD
						</button>
						<button
							type="button"
							className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
								linha.moeda === "EUR" ? "bg-[#114437] text-white" : "text-gray-600 hover:text-gray-800"
							}`}
							onClick={() => onChange(linha.id, { moeda: "EUR" })}
						>
							EUR
						</button>
					</div>
				) : null}

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label className="text-sm text-slate-700">
						<span className="mb-1 block font-medium">Quantidade de sacas</span>
						<FieldTooltip message={TOOLTIP_CULTURA} active={camposBloqueados}>
							<input
								type="number"
								min="0"
								step="0.01"
								value={linha.quantidadeSacas}
								readOnly={camposBloqueados}
								onChange={(event) => {
									if (camposBloqueados) return;
									onChange(linha.id, { quantidadeSacas: event.target.value });
								}}
								className={`h-10 w-full rounded-lg border border-gray-200 px-3 text-sm shadow-sm focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20 ${inputBloqueadoCls}`}
								placeholder="0"
								required
							/>
						</FieldTooltip>
					</label>

					<label className="text-sm text-slate-700">
						<span className="mb-1 block font-medium">{labelValor}</span>
						<FieldTooltip message={TOOLTIP_CULTURA} active={camposBloqueados}>
							<input
								type="number"
								min="0"
								step="0.01"
								value={linha.valorSaca}
								readOnly={camposBloqueados}
								onChange={(event) => {
									if (camposBloqueados) return;
									onChange(linha.id, { valorSaca: event.target.value });
								}}
								className={`h-10 w-full rounded-lg border border-gray-200 px-3 text-sm shadow-sm focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20 ${inputBloqueadoCls}`}
								placeholder="0,00"
								required
							/>
						</FieldTooltip>
					</label>
				</div>
			</div>
		</div>
	);
}
