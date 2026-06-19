import "./cardList.css";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  UndoIcon,
} from "../../components/ui/icons.jsx";

export default function LembreteCardList({
  lembretes = [],
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  itensPorPagina = 4,
  onPageChange,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedDate
}) {

  const recorrenciaLabel = {
    NENHUMA: "Sem recorrência",
    SEMANAL: "1 vez por semana",
    MENSAL: "1 vez por mês",
    TRIMESTRAL: "1 vez a cada 3 meses",
    ANUAL: "1 vez por ano",
    OUTROS: "Personalizada",
  };

  const statusMap = {
    ATRASADO: "red",
    PENDENTE: "yellow",
    ENVIADO: "green",
  };

  const statusLabel = {
    ATRASADO: "Atrasado",
    PENDENTE: "Pendente",
    ENVIADO: "Concluído",
    CANCELADO: "Cancelado"
  };

  const statusIcon = {
    ATRASADO: <ClockIcon />,
    PENDENTE: <ClockIcon />,
    ENVIADO: <CheckIcon />,
    CANCELADO: null,
  };

  const statusColor = {
    ATRASADO: "text-red-700",
    PENDENTE: "text-yellow-700",
    ENVIADO: "text-green-700",
    CANCELADO: "text-gray-400",
  };

  const formatarLembretes = (lista) => {
    return lista.map((item) => ({
      ...item,

      dataFormatada: new Date(item.dataLembrete).toLocaleDateString(
        "pt-BR"
      ),

      dataCompleta: new Date(item.dataLembrete).toLocaleDateString(
        "pt-BR",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      ),

      telefone: item.telefoneWhatsapp || "-",
      descricao: item.descricao || "-",
    }));
  };

  const lembretesFormatados = formatarLembretes(lembretes);
  if (isLoading) return <p>Carregando...</p>;

  const inicioAtual = totalItems === 0 ? 0 : (currentPage - 1) * itensPorPagina + 1;
  const fimAtual = totalItems === 0 ? 0 : Math.min(currentPage * itensPorPagina, totalItems);
  const visiblePages = [];
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, startPage + 2);

  for (let page = startPage; page <= endPage; page += 1) {
    visiblePages.push(page);
  }

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "-";
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "-";
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  };

  const dataTitulo = new Date(selectedDate + "T00:00:00")
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="lembrete-card-list">
      <h3 className="lembrete-list-header-title">
        Lembretes do dia <span className="lembrete-data-titulo">{dataTitulo}</span>
      </h3>

      {lembretesFormatados.length === 0 && (
        <p>Nenhum lembrete para este dia.</p>
      )}

      {lembretesFormatados.map((item) => {
        const isGasto = item.tipo === "GASTO";

        return (
          <div key={item.id} className={`lembrete-card ${statusMap[item.status]} lembrete-card-evento`}>
            <div className="lembrete-card-header">
              <div className="lembrete-card-top">
                <span className={`lembrete-dot ${statusMap[item.status]}`} />

                <span className="lembrete-title">{item.titulo}</span>

                <span className={`lembrete-status ${statusColor[item.status]} ${statusMap[item.status]}`}>
                  {statusIcon[item.status]}
                  {statusLabel[item.status]}
                </span>
              </div>

              <div className="lembrete-card-date">
                <span>{item.dataFormatada}</span>
              </div>
            </div>

            <div className="lembrete-card-bottom">
              <div>
                <p className="lembrete-desc">{item.descricao}</p>
                <p>{item.telefone}</p>

                  <div className="lembrete-meta-grid">
                    <span><strong>Fazenda:</strong> {item.fazenda?.nome ?? "-"}</span>
                    <span><strong>Talhão:</strong> {item.talhao?.nome ?? "-"}</span>
                    <span><strong>Cultura:</strong> {item.cultura?.nome ?? "-"}</span>
                    <span><strong>Colheita:</strong> {item.colheita?.ano ? `Safra ${item.colheita.ano}` : "-"}</span>
                    <span><strong>Valor:</strong> {formatarMoeda(item.valor)}</span>
                    <span><strong>Recorrência:</strong> {item.recorrencia === "OUTROS" ? (item.recorrenciaCustom || "Personalizada") : (recorrenciaLabel[item.recorrencia] || "Sem recorrência")}</span>
                  </div>
              </div>

              {!isGasto && (
                <div className="lembrete-actions">
                  {item.status === "ENVIADO" ? (
                    <button
                      type="button"
                      className="lembrete-btn-undo"
                      title="Desmarcar conclusão"
                      aria-label="Desmarcar conclusão"
                      onClick={() => onToggleStatus(item)}
                    >
                      <UndoIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lembrete-btn-complete"
                      title="Marcar como concluído"
                      aria-label="Marcar como concluído"
                      onClick={() => onToggleStatus(item)}
                    >
                      <CheckIcon />
                    </button>
                  )}

                  <button className="lembrete-btn-edit" title="Editar" onClick={() => onEdit(item)}>
                    <PencilIcon />
                  </button>

                  <button className="lembrete-btn-delete" title="Excluir" onClick={() => onDelete(item)}>
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Mostrando {inicioAtual} a {fimAtual} de {totalItems} lembrete{totalItems === 1 ? "" : "s"}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            aria-label="Pagina anterior"
          >
            ‹
          </button>

          {visiblePages.map((page) => {
            const active = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange?.(page)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${
                  active
                    ? "border-[#0d4f3a] bg-[#0d4f3a] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            aria-label="Proxima pagina"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}