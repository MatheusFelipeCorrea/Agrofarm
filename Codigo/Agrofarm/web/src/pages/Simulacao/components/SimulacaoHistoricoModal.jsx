import { useCallback, useState } from "react";
import { Clock, TrashIcon } from "lucide-react";
import {
	useBuscarSimulacaoHistorico,
	useExcluirSimulacaoMutation,
} from "../../../queries/simulacao/useSimulacaoQueries.js";
import AgroConfirmDialog from "../../../components/dialogs/AgroConfirmDialog.jsx";
import Modal, { ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../../../components/ui/Modal/Modal.jsx";
import { formatBRL, formatDateBR, formatNumberPtBR } from "../../../utils/formatters.js";

/**
 * Montar apenas quando o histórico estiver aberto (render condicional no pai).
 * Assim o estado interno reinicia ao fechar, sem useEffect para reset.
 */
export function SimulacaoHistoricoModal({ onClose, fazendaId, onRestaurar }) {
	const [selecionada, setSelecionada] = useState(null);
	const [confirmarExclusao, setConfirmarExclusao] = useState(null);

	const { data: historico = [], isLoading } = useBuscarSimulacaoHistorico(fazendaId, { enabled: true });

	const excluirMutation = useExcluirSimulacaoMutation();

	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	function handleRestaurar() {
		if (!selecionada) return;
		onRestaurar(selecionada);
		onClose();
	}

	async function handleConfirmarExclusao() {
		if (!confirmarExclusao) return;
		await excluirMutation.mutateAsync(confirmarExclusao.id);
		if (selecionada?.id === confirmarExclusao.id) {
			setSelecionada(null);
		}
		setConfirmarExclusao(null);
	}

	return (
		<>
			<Modal open onOpenChange={(next) => !next && handleClose()}>
				<ModalContent className="flex w-[min(94vw,640px)] max-h-[min(88dvh,560px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
					<ModalHeader className="border-b border-gray-100 px-6 py-5">
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-[#2e5b47]" aria-hidden />
							<ModalTitle className="text-lg font-semibold text-gray-900">Simulações anteriores</ModalTitle>
						</div>
					</ModalHeader>

					<ModalBody className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
						{isLoading ? (
							<p className="px-4 py-8 text-center text-sm text-gray-500">Carregando simulações...</p>
						) : historico.length === 0 ? (
							<p className="px-4 py-8 text-center text-sm text-gray-500">Nenhuma simulação salva encontrada.</p>
						) : (
							<ul className="divide-y divide-gray-100">
								{historico.map((sim) => {
									const ativa = selecionada?.id === sim.id;
									return (
										<li key={sim.id}>
											<div
												className={`flex items-start gap-3 px-4 py-3 transition-colors ${
													ativa ? "bg-[#f1f8f4]" : "hover:bg-gray-50"
												}`}
											>
												<button
													type="button"
													className="min-w-0 flex-1 text-left"
													onClick={() => setSelecionada(sim)}
												>
													<div className="flex flex-wrap items-center gap-2">
														<p className="font-semibold text-gray-900">{sim.cultura}</p>
														<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
															{sim.moeda === "BRL" || sim.composicaoTaxas?.isExportacao === false
																? "Mercado interno"
																: sim.moeda === "EUR"
																	? "Euro"
																	: "Dólar"}
														</span>
														{sim.fazenda ? (
															<span className="text-xs text-gray-500">{sim.fazenda}</span>
														) : null}
													</div>
													<div className="mt-1 space-y-0.5 text-sm text-gray-600">
														<p>
															{formatNumberPtBR(sim.quantidadeSacas)} sacas × {formatBRL(sim.valorSaca)}
														</p>
														<p>Líquido: {formatBRL(sim.valorLiquido)}</p>
														<p className="text-xs text-gray-400">{formatDateBR(sim.criadoEm)}</p>
													</div>
												</button>
												<button
													type="button"
													className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
													aria-label={`Excluir simulação de ${sim.cultura}`}
													onClick={() => setConfirmarExclusao(sim)}
												>
													<TrashIcon className="h-4 w-4" />
												</button>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</ModalBody>

					<ModalFooter className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
						>
							Fechar
						</button>
						<button
							type="button"
							onClick={handleRestaurar}
							disabled={!selecionada}
							className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2e5b47] px-5 text-sm font-semibold text-white hover:bg-[#254a3a] disabled:cursor-not-allowed disabled:opacity-40"
						>
							Restaurar
						</button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<AgroConfirmDialog
				open={Boolean(confirmarExclusao)}
				title="Excluir simulação"
				message="Deseja excluir esta simulação do histórico?"
				description={
					confirmarExclusao
						? `A simulação de ${confirmarExclusao.cultura} (${formatNumberPtBR(confirmarExclusao.quantidadeSacas)} sacas) será removida permanentemente.`
						: ""
				}
				confirmLabel="Excluir"
				loading={excluirMutation.isPending}
				onClose={() => setConfirmarExclusao(null)}
				onConfirm={handleConfirmarExclusao}
			/>
		</>
	);
}
