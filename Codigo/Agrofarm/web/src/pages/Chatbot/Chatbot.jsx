import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../../layouts/MainLayout.jsx";
import { useCotacaoMercadoQuery } from "../../queries/cotacao/useCotacaoQueries.js";
import { useFazendaListQuery } from "../../queries/fazenda/useFazendaQueries.js";
import {
  useChatbotEnviarMutation,
  useChatbotExcluirSessaoMutation,
  useChatbotMensagensQuery,
  useChatbotRenomearSessaoMutation,
  useChatbotResumoQuery,
  useChatbotSessoesQuery,
} from "../../queries/chatbot/useChatbotQueries.js";
import { useChatbotWeather } from "./useChatbotWeather.js";
import ChatAssistantMarkdown from "./ChatAssistantMarkdown.jsx";
import WeatherLocationCard from "./WeatherLocationCard.jsx";


const SELECT_FIELD_CLS =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const SUGESTOES = [
  "Qual meu saldo e quanto tenho de gastos pendentes?",
  "O que tenho no estoque por fazenda?",
  "Compare minhas fazendas: onde faz sentido investir e onde não?",
  "Como cadastro uma colheita no AgroFarm?",
  "Considerando o mercado hoje, qual cultura parece mais promissora nos meus dados?",
];

const FAQ_ITENS = [
  {
    id: "dados",
    titulo: "A IA usa meus dados reais do AgroFarm?",
    texto:
      "Sim. A IA recebe fazendas, culturas, hectares, estoque, lucros, gastos, colheitas recentes, lembretes, insumos, comparativo entre propriedades e cotações de mercado — sempre dentro do que seu usuário pode ver no sistema.",
  },
  {
    id: "clima",
    titulo: "Ela prevê clima na minha propriedade?",
    texto:
      "Sim, ao escolher uma fazenda o clima usa as coordenadas das áreas desenhadas no mapa (polígonos), quando existirem; senão, a localização cadastrada em texto. Você também pode buscar outra cidade. Os dados vêm do Open-Meteo e atualizam a cada ~10 min.",
  },
  {
    id: "precos",
    titulo: "Os preços de commodities são oficiais?",
    texto:
      "As cotações exibidas seguem as mesmas fontes do painel de mercado do sistema (ex.: futuros internacionais e câmbio). Preços físicos na sua região podem diferir.",
  },
  {
    id: "investir",
    titulo: "Posso pedir opinião (investir, mercado, prioridades)?",
    texto:
      `Sim. O assistente cruza seus números com cotações (dólar e commodities) e pode responder no estilo "não recomendaria a fazenda X porque…", "a fazenda Y na cultura Z parece promissora porque…". Não substitui consultoria formal.`,
  },
  {
    id: "sistema",
    titulo: "Ele só fala dos meus dados ou também do sistema?",
    texto:
      "Dos dois. Você pode perguntar como usar Gastos, Colheitas, Estoque etc., ou pedir análises sobre o que já cadastrou — inclusive comparações entre fazendas e contexto de mercado.",
  },
  {
    id: "tipos",
    titulo: "Todos os tipos de pergunta funcionam?",
    texto:
      `Sim. Perguntas objetivas sobre seus números (estoque, lucro, gastos, saldo, cotações, lembretes…) e análises mais abertas ("devo investir…", comparações, opinião) usam os dados cadastrados no AgroFarm.`,
  },
  {
    id: "erros",
    titulo: "Posso confiar cegamente nas respostas?",
    texto:
      "Não. Modelos de linguagem podem errar. Valide decisões financeiras e agronômicas com profissionais e com os dados conferidos no próprio AgroFarm.",
  },
];

function MiniSpark({ positive, label }) {
  const points = positive ? "0,12 4,8 8,10 12,4 16,6 20,2 24,5" : "0,4 4,8 8,6 12,12 16,10 20,14 24,8";
  return (
    <svg viewBox="0 0 24 14" className="h-8 w-20 shrink-0 text-inherit" aria-hidden>
      <title>{label}</title>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.85"
      />
    </svg>
  );
}

function formatarMoedaBR(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarVariacao(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(2).replace(".", ",")}%`;
}

function formatarTitulo(sessao, maxLen = 52) {
  const t = (sessao?.titulo || "Conversa").trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function IconHamburger() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconPencil({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5" aria-label="Assistente digitando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function IconPlus() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function Chatbot() {
  /** null = nova conversa; string = id de sessão do histórico */
  const [escolhaSessao, setEscolhaSessao] = useState(null);
  const [texto, setTexto] = useState("");
  const [faqAberto, setFaqAberto] = useState(null);
  const [infoRapidasExpandida, setInfoRapidasExpandida] = useState(() => {
    try {
      return window.localStorage.getItem("agrofarm-chatbot-info-rapidas-v1") !== "0";
    } catch {
      return true;
    }
  });
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [editandoTituloId, setEditandoTituloId] = useState(null);
  const [tituloEdit, setTituloEdit] = useState("");
  const [editandoHeaderTitulo, setEditandoHeaderTitulo] = useState(false);
  const [headerTituloEdit, setHeaderTituloEdit] = useState("");

  const listaRef = useRef(null);
  const headerInputRef = useRef(null);
  const sidebarInputRef = useRef(null);

  const { data: sessoes = [], isSuccess: sessoesOk } = useChatbotSessoesQuery();
  const sessaoAtiva = escolhaSessao;

  const { data: mensagensRaw = [], isLoading: carregandoMsgs } = useChatbotMensagensQuery(sessaoAtiva, {
    enabled: typeof sessaoAtiva === "string" && sessaoAtiva.length > 0,
  });
  const mensagens = typeof sessaoAtiva === "string" ? mensagensRaw : [];

  const { data: resumoDados, isLoading: carregandoResumo, refetch: refetchResumo } = useChatbotResumoQuery();

  const enviar = useChatbotEnviarMutation();
  const renomearSessao = useChatbotRenomearSessaoMutation();
  const excluirSessao = useChatbotExcluirSessaoMutation();
  const acaoSessaoPendente = renomearSessao.isPending || excluirSessao.isPending;

  const { data: mercadoData } = useCotacaoMercadoQuery({ staleTime: 60_000 });

  const { data: fazendas = [] } = useFazendaListQuery();
  const clima = useChatbotWeather(fazendas);
  const { data: climaData, isLoading: climaCarregando, isError: climaErro } = clima.weatherQuery;

  // Scroll para o fim quando há novas mensagens ou IA está pensando
  useEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [mensagens.length, enviar.isPending]);

  // Quando entra em um chat do histórico, rola até o fim
  useEffect(() => {
    if (typeof sessaoAtiva !== "string") return;
    const el = listaRef.current;
    if (!el) return;
    // Aguarda renderização das mensagens
    const timer = setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 80);
    return () => clearTimeout(timer);
  }, [sessaoAtiva]);

  // Foca o input de renomear quando ativa na sidebar
  useEffect(() => {
    if (editandoTituloId && sidebarInputRef.current) {
      sidebarInputRef.current.focus();
      sidebarInputRef.current.select();
    }
  }, [editandoTituloId]);

  // Foca o input de renomear na header
  useEffect(() => {
    if (editandoHeaderTitulo && headerInputRef.current) {
      headerInputRef.current.focus();
      headerInputRef.current.select();
    }
  }, [editandoHeaderTitulo]);

  function toggleInfoRapidas() {
    setInfoRapidasExpandida((v) => {
      const next = !v;
      try {
        window.localStorage.setItem("agrofarm-chatbot-info-rapidas-v1", next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  }

  const primeiraCommodity = useMemo(() => {
    const list = mercadoData?.commodities;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[0];
  }, [mercadoData]);

  const tempAtual = climaData?.current?.temperature_2m;
  const umidadeAtual = climaData?.current?.relative_humidity_2m;
  const codeClima = climaData?.current?.weather_code;

  const sessaoAtivaObj = useMemo(
    () => sessoes.find((s) => s.id === sessaoAtiva) ?? null,
    [sessoes, sessaoAtiva],
  );

  function handleNovaConversa() {
    setEscolhaSessao(null);
    setTexto("");
    setEditandoHeaderTitulo(false);
    setEditandoTituloId(null);
  }

  function handleSelecionarSessao(id) {
    setEscolhaSessao(id);
    setTexto("");
    setEditandoHeaderTitulo(false);
    setEditandoTituloId(null);
  }

  function handleEnviar() {
    const c = texto.trim();
    if (!c || enviar.isPending) return;

    enviar.mutate(
      { sessaoId: typeof sessaoAtiva === "string" ? sessaoAtiva : null, conteudo: c },
      {
        onSuccess: (data) => {
          setEscolhaSessao(data.sessaoId);
          setTexto("");
        },
      },
    );
  }

  // Sidebar rename
  function iniciarRenameSidebar(sessao, e) {
    e.stopPropagation();
    setEditandoTituloId(sessao.id);
    setTituloEdit((sessao.titulo || "Conversa").trim());
  }

  function confirmarRenameSidebar(sessaoId) {
    const titulo = tituloEdit.replace(/\s+/g, " ").trim();
    if (!titulo) return;
    renomearSessao.mutate({ sessaoId, titulo });
    setEditandoTituloId(null);
  }

  function cancelarRenameSidebar() {
    setEditandoTituloId(null);
    setTituloEdit("");
  }

  // Header rename
  function iniciarRenameHeader() {
    if (!sessaoAtivaObj) return;
    setHeaderTituloEdit((sessaoAtivaObj.titulo || "Conversa").trim());
    setEditandoHeaderTitulo(true);
  }

  function confirmarRenameHeader() {
    const titulo = headerTituloEdit.replace(/\s+/g, " ").trim();
    if (!titulo || !sessaoAtiva) return;
    renomearSessao.mutate({ sessaoId: sessaoAtiva, titulo });
    setEditandoHeaderTitulo(false);
  }

  function cancelarRenameHeader() {
    setEditandoHeaderTitulo(false);
  }

  function handleExcluirSessao(sessao, e) {
    e.stopPropagation();
    const titulo = formatarTitulo(sessao);
    const ok = window.confirm(`Apagar a conversa "${titulo}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    excluirSessao.mutate(sessao.id, {
      onSuccess: () => {
        if (sessaoAtiva === sessao.id) setEscolhaSessao(null);
        setEditandoTituloId(null);
      },
    });
  }

  const erroMsg = enviar.isError
    ? enviar.error?.response?.data?.message ?? "Não foi possível enviar a mensagem."
    : null;

  const tituloHeader = sessaoAtivaObj
    ? formatarTitulo(sessaoAtivaObj, 60)
    : "Nova conversa";

  return (
    <MainLayout hideHeaderInput hideBreadcrumbs>
      {/* Remove o padding do MainLayout para controle total da altura */}
      <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-5 lg:-mx-8 lg:-my-6 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── CABEÇALHO DA PÁGINA ── */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
          <header className="space-y-0.5">
            <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Assistente IA</h1>
            <p className="text-[0.95rem] text-gray-500">Consultas precisas nos seus dados e análises com contexto de mercado.</p>
          </header>
        </div>

        {/* ── LINHA PRINCIPAL: sidebar + chat ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── SIDEBAR ESQUERDA ── */}
        <div
          className={`
            flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out overflow-hidden shrink-0
            ${sidebarAberta ? "w-[230px]" : "w-0"}
          `}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">Conversas</span>
          </div>
          <button
            type="button"
            onClick={handleNovaConversa}
            className="mx-3 my-2 flex items-center gap-2 rounded-lg border border-dashed border-[#22c55e]/50 px-3 py-2 text-sm font-medium text-[#0f7f3b] transition-colors hover:bg-[#22c55e]/8"
          >
            <IconPlus />
            Nova conversa
          </button>
          <div className="flex-1 overflow-y-auto scrollbar-chatbot py-1">
            {!sessoesOk ? (
              <p className="px-3 py-2 text-xs text-slate-400">Carregando…</p>
            ) : sessoes.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">Nenhuma conversa ainda.</p>
            ) : (
              <ul>
                {sessoes.map((s) => {
                  const ativa = sessaoAtiva === s.id;
                  const editando = editandoTituloId === s.id;
                  return (
                    <li key={s.id} className="group">
                      {editando ? (
                        <div className="flex items-center gap-1 px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={sidebarInputRef}
                            type="text"
                            value={tituloEdit}
                            maxLength={120}
                            disabled={acaoSessaoPendente}
                            onChange={(e) => setTituloEdit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); confirmarRenameSidebar(s.id); }
                              if (e.key === "Escape") cancelarRenameSidebar();
                            }}
                            className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-[#2e5b47] focus:outline-none focus:ring-1 focus:ring-[#2e5b47]/30"
                          />
                          <button
                            type="button"
                            disabled={acaoSessaoPendente}
                            onClick={() => confirmarRenameSidebar(s.id)}
                            className="rounded bg-[#0f7f3b] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#0d6d33] disabled:opacity-50"
                          >
                            Ok
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-0.5 pr-1 ${ativa ? "bg-[#22c55e]/10" : "hover:bg-slate-50"}`}>
                          <button
                            type="button"
                            onClick={() => handleSelecionarSessao(s.id)}
                            className={`min-w-0 flex-1 truncate px-3 py-2.5 text-left text-[13px] transition-colors ${ativa ? "font-semibold text-slate-900" : "font-medium text-gray-700"}`}
                          >
                            {formatarTitulo(s, 28)}
                          </button>
                          <button
                            type="button"
                            title="Renomear"
                            disabled={acaoSessaoPendente}
                            onClick={(e) => iniciarRenameSidebar(s, e)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-opacity hover:bg-white hover:text-[#0f7f3b] group-hover:opacity-100 disabled:opacity-40"
                          >
                            <IconPencil />
                          </button>
                          <button
                            type="button"
                            title="Apagar"
                            disabled={acaoSessaoPendente}
                            onClick={(e) => handleExcluirSessao(s, e)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── ÁREA PRINCIPAL ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Header da conversa */}
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
            <button
              type="button"
              onClick={() => setSidebarAberta((v) => !v)}
              aria-label={sidebarAberta ? "Recolher histórico" : "Expandir histórico"}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            >
              <IconHamburger />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {editandoHeaderTitulo ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    ref={headerInputRef}
                    type="text"
                    value={headerTituloEdit}
                    maxLength={120}
                    disabled={acaoSessaoPendente}
                    onChange={(e) => setHeaderTituloEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); confirmarRenameHeader(); }
                      if (e.key === "Escape") cancelarRenameHeader();
                    }}
                    onBlur={confirmarRenameHeader}
                    className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-800 focus:border-[#2e5b47] focus:outline-none focus:ring-1 focus:ring-[#2e5b47]/30"
                  />
                  <button
                    type="button"
                    disabled={acaoSessaoPendente}
                    onClick={confirmarRenameHeader}
                    className="rounded bg-[#0f7f3b] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d6d33] disabled:opacity-50"
                  >
                    Ok
                  </button>
                  <button
                    type="button"
                    onClick={cancelarRenameHeader}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={sessaoAtivaObj ? iniciarRenameHeader : undefined}
                  title={sessaoAtivaObj ? "Clique duas vezes para renomear" : undefined}
                  className={`truncate text-sm font-semibold text-slate-800 ${sessaoAtivaObj ? "cursor-text select-none" : "text-slate-400"}`}
                >
                  {tituloHeader}
                </span>
              )}
              {sessaoAtivaObj && !editandoHeaderTitulo ? (
                <button
                  type="button"
                  onClick={iniciarRenameHeader}
                  title="Renomear conversa"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <IconPencil className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Conteúdo: chat + aside direita */}
          <div className="flex min-h-0 flex-1 overflow-hidden">

            {/* Chat */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div
                ref={listaRef}
                className="scrollbar-chatbot min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
              >
                {!sessoesOk ? <p className="text-sm text-slate-500">Carregando conversas…</p> : null}

                {sessoesOk && sessaoAtiva === null && mensagens.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 px-4 py-5 sm:px-6">
                    <p className="text-sm font-semibold text-slate-900">Olá! Sou seu assistente no AgroFarm.</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Consulto seus dados reais — fazendas, colheitas, gastos, lucros e estoque — e cruzo com o mercado
                      quando fizer sentido. Perguntas objetivas recebem números diretos; análises comparativas vêm com
                      motivos claros e ressalvas.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Dica: seja específico (“saldo da Fazenda X”, “gastos pendentes”, “compare minhas fazendas”).
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {SUGESTOES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTexto(s)}
                          className="rounded-full border border-[#22c55e]/35 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-800 shadow-sm transition-colors hover:bg-[#22c55e]/10"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {typeof sessaoAtiva === "string" && carregandoMsgs ? (
                  <p className="text-sm text-slate-500">Carregando mensagens…</p>
                ) : null}

                {mensagens.map((m) => (
                  <div key={m.id} className={`flex ${m.papel === "usuario" ? "justify-end" : "justify-start gap-2"}`}>
                    {m.papel !== "usuario" ? (
                      <div
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                        aria-hidden
                      >
                        IA
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[min(100%,34rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        m.papel === "usuario"
                          ? "rounded-br-md bg-[#22c55e] text-white"
                          : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800"
                      }`}
                    >
                      {m.papel === "usuario" ? (
                        <p className="whitespace-pre-wrap">{m.conteudo}</p>
                      ) : (
                        <ChatAssistantMarkdown content={m.conteudo} />
                      )}
                      {m.papel !== "usuario" && m.fonteResposta === "consulta_rapida" ? (
                        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-snug text-emerald-700/85">
                          Consulta direta no banco de dados
                        </p>
                      ) : null}
                      {m.papel !== "usuario" && m.fonteResposta === "dados" ? (
                        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-snug text-slate-500">
                          Só dados do sistema
                        </p>
                      ) : null}
                      {m.papel !== "usuario" && m.fonteResposta === "ia" ? (
                        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-snug text-slate-500">
                          Resposta com IA · valide números importantes
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}

                {enviar.isPending ? (
                  <div className="flex justify-start gap-2">
                    <div
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                      aria-hidden
                    >
                      IA
                    </div>
                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      <TypingIndicator />
                    </div>
                  </div>
                ) : null}

                {erroMsg ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erroMsg}</div>
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-slate-100 px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-2 sm:flex-row sm:items-end">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviar();
                      }
                    }}
                    rows={2}
                    placeholder="Pergunte sobre sua fazenda, culturas, mercado, clima…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#22c55e]/50 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/20"
                  />
                  <button
                    type="button"
                    onClick={handleEnviar}
                    disabled={enviar.isPending || !texto.trim()}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#22c55e] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
                  Use o chat para consultar lucros, gastos, culturas, lembretes e pedir análises com base nos seus dados.
                </p>
              </footer>
            </div>

            {/* ── ASIDE DIREITA ── */}
            <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 xl:flex xl:flex-col xl:gap-4">
              <section>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Informações rápidas</h2>
                  <button
                    type="button"
                    onClick={toggleInfoRapidas}
                    aria-expanded={infoRapidasExpandida}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    {infoRapidasExpandida ? "Minimizar" : "Expandir"}
                  </button>
                </div>

                {!infoRapidasExpandida ? (
                  <p className="mt-1 text-[11px] text-slate-500">Mercado, câmbio e clima ocultos.</p>
                ) : null}

                {infoRapidasExpandida ? (
                  <div className="mt-2 space-y-3">
                    <article className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500">Mercado</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {primeiraCommodity
                              ? `${primeiraCommodity.nome} (${formatarVariacao(primeiraCommodity.variacao)})`
                              : "Painel de mercado"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {primeiraCommodity
                              ? formatarMoedaBR(primeiraCommodity.valor)
                              : "Acompanhe commodities no menu lateral."}
                          </p>
                        </div>
                        <div className={primeiraCommodity && Number(primeiraCommodity.variacao) < 0 ? "text-rose-500" : "text-emerald-600"}>
                          <MiniSpark positive={primeiraCommodity ? Number(primeiraCommodity.variacao) >= 0 : true} label="Tendência" />
                        </div>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500">Câmbio</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">Dólar (USD/BRL)</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {mercadoData?.dolar?.valor != null
                              ? `${formatarMoedaBR(mercadoData.dolar.valor)} (${formatarVariacao(mercadoData.dolar.variacao)})`
                              : "—"}
                          </p>
                        </div>
                        <div className={mercadoData?.dolar?.variacao != null && Number(mercadoData.dolar.variacao) < 0 ? "text-rose-500" : "text-emerald-600"}>
                          <MiniSpark positive={mercadoData?.dolar?.variacao == null ? true : Number(mercadoData.dolar.variacao) >= 0} label="Dólar" />
                        </div>
                      </div>
                    </article>

                    <WeatherLocationCard
                      selectClassName={SELECT_FIELD_CLS}
                      tempAtual={tempAtual}
                      umidadeAtual={umidadeAtual}
                      codeClima={codeClima}
                      location={clima.location}
                      fazendaOptions={clima.fazendaOptions}
                      activeFazendaId={clima.activeFazendaId}
                      geocoding={clima.geocoding}
                      geoErro={clima.geoErro}
                      onSelectFazenda={clima.selectFazenda}
                      buscaTexto={clima.buscaTexto}
                      onBuscaChange={(e) => clima.setBuscaTexto(e.target.value)}
                      buscaAberta={clima.buscaAberta}
                      resultadosBusca={clima.resultadosBusca}
                      buscando={clima.buscando}
                      buscaRef={clima.buscaRef}
                      onSelectSearchResult={clima.selectSearchResult}
                      atualizadoEm={clima.atualizadoEm}
                      isLoading={climaCarregando || clima.geocoding}
                      isError={climaErro}
                    />
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Seus números</h2>
                  <button
                    type="button"
                    onClick={() => refetchResumo()}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#16a34a] hover:bg-[#22c55e]/10"
                  >
                    Atualizar
                  </button>
                </div>
                {carregandoResumo ? (
                  <p className="mt-2 text-xs text-slate-500">Carregando…</p>
                ) : (
                  <dl className="mt-3 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Fazendas visíveis</dt>
                      <dd className="font-semibold text-slate-900">{resumoDados?.fazendas?.length ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Registros de colheita</dt>
                      <dd className="font-semibold text-slate-900">{resumoDados?.colheitasTotal ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Total lucros</dt>
                      <dd>{formatarMoedaBR(resumoDados?.totalLucros)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Total gastos</dt>
                      <dd>{formatarMoedaBR(resumoDados?.totalGastos)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                      <dt className="font-medium text-slate-700">Saldo aprox.</dt>
                      <dd className="font-semibold text-slate-900">{formatarMoedaBR(resumoDados?.saldoAproximado)}</dd>
                    </div>
                  </dl>
                )}
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  Valores no escopo das fazendas que você pode acessar; o chat usa a mesma base.
                </p>
                {!carregandoResumo && (resumoDados?.fazendas?.length ?? 0) > 0 && (resumoDados?.colheitasTotal ?? 0) === 0 ? (
                  <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2 text-[10px] leading-relaxed text-amber-900">
                    Há fazendas cadastradas, mas sem colheitas. Lucros e gastos no AgroFarm são vinculados a colheitas —
                    cadastre em <strong>Colheitas</strong> para os totais aparecerem aqui e no assistente.
                  </p>
                ) : null}
              </section>

              <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Perguntas frequentes</h2>
                <ul className="mt-3 space-y-1">
                  {FAQ_ITENS.map((item) => (
                    <li key={item.id} className="border-b border-slate-100 last:border-0">
                      <button
                        type="button"
                        onClick={() => setFaqAberto((v) => (v === item.id ? null : item.id))}
                        className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm font-medium text-slate-800"
                      >
                        {item.titulo}
                        <span className="text-slate-400">{faqAberto === item.id ? "−" : "+"}</span>
                      </button>
                      {faqAberto === item.id ? (
                        <p className="pb-3 text-xs leading-relaxed text-slate-600">{item.texto}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </aside>

          </div>
        </div>

        </div>{/* ── fim linha principal ── */}
      </div>
    </MainLayout>
  );
}

