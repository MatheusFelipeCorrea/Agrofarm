import { useDialogEscapeAndScrollLock } from "../../hooks/useDialogEscapeAndScrollLock.js";
import { useEstoqueDetalheQuery } from "../../queries/estoque/useEstoqueQueries.js";
import { formatNumberPtBR } from "../../utils/formatters.js";
import CulturaIcon from "../cultura/CulturaIcon.jsx";
import {
  CalendarIcon,
  ClockIcon,
  HandshakeIcon,
  HomeIcon,
  MapPinIcon,
  SackIcon,
} from "../ui/icons.jsx";
import Modal, { ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../ui/Modal/Modal.jsx";
import {
  AgroDataTable,
  AgroDataTableBody,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
} from "../ui/DataTable/AgroDataTable.jsx";
import { EstoqueStatusBadge } from "../ui/badges/DomainBadges.jsx";

function InfoItem({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2e5b47] shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="text-sm font-semibold text-gray-900">{children}</div>
      </div>
    </div>
  );
}

function DetalheGrid({ detalhe }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <InfoItem icon={<HomeIcon className="h-4 w-4" />} label="Fazenda">
        {detalhe.fazenda?.nome ?? "—"}
      </InfoItem>
      <InfoItem icon={<CulturaIcon cultura={detalhe.cultura} size="sm" className="!h-9 !w-9" />} label="Cultura">
        {detalhe.cultura?.nome ?? "—"}
      </InfoItem>
      <InfoItem icon={<CalendarIcon className="h-4 w-4" />} label="Safra / Colheita">
        {detalhe.ano ?? "—"}
      </InfoItem>
      <InfoItem icon={<SackIcon className="h-4 w-4" />} label="Produzidas">
        {formatNumberPtBR(detalhe.produzidas)} sacas
      </InfoItem>
      <InfoItem icon={<HandshakeIcon className="h-4 w-4" />} label="Vendidas">
        {formatNumberPtBR(detalhe.vendidas)} sacas
      </InfoItem>
      <InfoItem icon={<SackIcon className="h-4 w-4" />} label="Em estoque">
        <span className="text-green-700">{formatNumberPtBR(detalhe.emEstoque)} sacas</span>
      </InfoItem>
      <InfoItem icon={<MapPinIcon className="h-4 w-4" />} label="Local">
        {detalhe.localizacao ?? "—"}
      </InfoItem>
      <InfoItem icon={<SackIcon className="h-4 w-4" />} label="Status">
        <EstoqueStatusBadge status={detalhe.status} />
      </InfoItem>
    </div>
  );
}

function MovimentacaoTipo({ tipo }) {
  if (tipo === "ENTRADA_INICIAL") {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-700">
        <span aria-hidden>↑</span>
        Entrada inicial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-blue-700">
      <HandshakeIcon className="h-4 w-4" />
      Venda
    </span>
  );
}

function MovimentacoesTable({ movimentacoes }) {
  return (
    <>
      <AgroDataTable minWidth={560}>
        <AgroDataTableHead>
          <AgroDataTableTh align="left">Data</AgroDataTableTh>
          <AgroDataTableTh align="left">Tipo</AgroDataTableTh>
          <AgroDataTableTh>Quantidade</AgroDataTableTh>
          <AgroDataTableTh align="left">Descrição / Observação</AgroDataTableTh>
        </AgroDataTableHead>
        <AgroDataTableBody>
          {movimentacoes.length === 0 ? (
            <AgroDataTableEmpty colSpan={4}>Nenhuma movimentação registrada.</AgroDataTableEmpty>
          ) : (
            movimentacoes.map((m) => (
              <AgroDataTableRow key={m.id}>
                <AgroDataTableTd align="left">{m.dataHora ?? m.data}</AgroDataTableTd>
                <AgroDataTableTd align="left">
                  <MovimentacaoTipo tipo={m.tipo} />
                </AgroDataTableTd>
                <AgroDataTableTd className="font-medium">
                  {formatNumberPtBR(m.quantidadeSacas)} sacas
                </AgroDataTableTd>
                <AgroDataTableTd align="left" className="text-gray-600">
                  {m.descricao}
                </AgroDataTableTd>
              </AgroDataTableRow>
            ))
          )}
        </AgroDataTableBody>
      </AgroDataTable>
      <p className="mt-2 text-xs text-gray-500">
        Mostrando {movimentacoes.length} de {movimentacoes.length} movimentações
      </p>
    </>
  );
}

export default function EstoqueDetalheModal({ open, colheitaId, lotePreview, onClose }) {
  useDialogEscapeAndScrollLock(open, onClose);

  const { data: detalhe, isLoading, isError } = useEstoqueDetalheQuery(colheitaId, {
    enabled: open && Boolean(colheitaId),
  });

  const lote = detalhe?.lote ?? lotePreview ?? "—";
  const movimentacoes = detalhe?.movimentacoes ?? [];

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent className="flex w-[min(94vw,920px)] max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <ModalHeader className="border-b border-gray-100">
          <ModalTitle className="text-xl">Detalhes do lote — {lote}</ModalTitle>
        </ModalHeader>

        <ModalBody className="max-h-[min(70dvh,640px)] overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">Carregando detalhes...</p>
          ) : isError || !detalhe ? (
            <p className="py-8 text-center text-sm text-red-500">Não foi possível carregar os detalhes do lote.</p>
          ) : (
            <>
              <DetalheGrid detalhe={detalhe} />
              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ClockIcon className="h-4 w-4 text-[#2e5b47]" />
                  Histórico de movimentações
                </h3>
                <MovimentacoesTable movimentacoes={movimentacoes} />
              </section>
            </>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-gray-100 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-10 items-center justify-center rounded-lg bg-[#2e5b47] px-6 text-sm font-semibold text-white hover:bg-[#254a3a]"
          >
            Fechar
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
