import { useEffect, useRef, useState } from "react";

function IconMenu() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function formatarTitulo(sessao) {
  const t = (sessao.titulo || "Conversa").trim();
  return t.length > 56 ? `${t.slice(0, 56)}…` : t;
}

export default function ChatConversationsMenu({
  sessoes,
  sessaoAtiva,
  onSelectSessao,
  onRenomearSessao,
  onExcluirSessao,
  disabled,
  acaoPendente,
}) {
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEdit, setTituloEdit] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false);
        setEditandoId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editandoId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editandoId]);

  if (!sessoes?.length) return null;

  function iniciarRenomear(sessao, e) {
    e.stopPropagation();
    setEditandoId(sessao.id);
    setTituloEdit((sessao.titulo || "Conversa").trim());
  }

  function confirmarRenomear(sessaoId) {
    const titulo = tituloEdit.replace(/\s+/g, " ").trim();
    if (!titulo) return;
    onRenomearSessao?.(sessaoId, titulo);
    setEditandoId(null);
  }

  function cancelarRenomear() {
    setEditandoId(null);
    setTituloEdit("");
  }

  function handleExcluir(sessao, e) {
    e.stopPropagation();
    const titulo = formatarTitulo(sessao);
    const ok = window.confirm(`Apagar a conversa "${titulo}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    onExcluirSessao?.(sessao.id);
    setEditandoId(null);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        disabled={disabled}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label="Minhas conversas"
        title="Minhas conversas"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IconMenu />
      </button>

      {aberto ? (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setAberto(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1.5 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Minhas conversas
            </p>
            <ul className="scrollbar-chatbot max-h-64 overflow-y-auto py-1">
              {sessoes.map((s) => {
                const ativa = sessaoAtiva === s.id;
                const editando = editandoId === s.id;

                return (
                  <li key={s.id} className="group border-b border-gray-50 last:border-0">
                    {editando ? (
                      <div className="flex items-center gap-1 px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={inputRef}
                          type="text"
                          value={tituloEdit}
                          maxLength={120}
                          disabled={acaoPendente}
                          onChange={(e) => setTituloEdit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              confirmarRenomear(s.id);
                            }
                            if (e.key === "Escape") cancelarRenomear();
                          }}
                          className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-800 focus:border-[#2e5b47] focus:outline-none focus:ring-1 focus:ring-[#2e5b47]/30"
                        />
                        <button
                          type="button"
                          disabled={acaoPendente}
                          onClick={() => confirmarRenomear(s.id)}
                          className="rounded-md bg-[#0f7f3b] px-2 py-1 text-xs font-semibold text-white hover:bg-[#0d6d33] disabled:opacity-50"
                        >
                          Ok
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-0.5 pr-1 ${
                          ativa ? "bg-[#22c55e]/10" : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onSelectSessao(s.id);
                            setAberto(false);
                          }}
                          className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm transition-colors ${
                            ativa ? "font-semibold text-slate-900" : "font-medium text-gray-700"
                          }`}
                        >
                          {formatarTitulo(s)}
                        </button>
                        <button
                          type="button"
                          title="Renomear"
                          disabled={acaoPendente}
                          onClick={(e) => iniciarRenomear(s, e)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 opacity-70 transition-opacity hover:bg-white hover:text-[#0f7f3b] group-hover:opacity-100 disabled:opacity-40"
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          title="Apagar"
                          disabled={acaoPendente}
                          onClick={(e) => handleExcluir(s, e)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 opacity-70 transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
