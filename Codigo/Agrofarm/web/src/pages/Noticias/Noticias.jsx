import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../../layouts/MainLayout.jsx";
import { useFazendaListQuery } from "../../queries/fazenda/useFazendaQueries.js";
import { useNoticiasInfiniteQuery } from "../../queries/noticia/useNoticiasQueries.js";
import { notify } from "../../lib/notify.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { ChevronDownIcon, SearchIcon } from "../../components/ui/icons.jsx";
import { useChatbotWeather } from "../Chatbot/useChatbotWeather.js";
import NoticiaCategoriaChips from "./components/NoticiaCategoriaChips.jsx";
import NoticiaDestaqueCard from "./components/NoticiaDestaqueCard.jsx";
import NoticiaListaItem from "./components/NoticiaListaItem.jsx";
import NoticiasClimaWidget from "./components/NoticiasClimaWidget.jsx";
import NoticiasTemasWidget from "./components/NoticiasTemasWidget.jsx";
import NoticiasFontesLinks from "./components/NoticiasFontesLinks.jsx";
import PrevisaoClimaModal from "./components/PrevisaoClimaModal.jsx";
import { filtrarNoticiasLocal } from "./noticiaFiltros.js";

const CATEGORIAS_PADRAO = [
  { id: "TODAS", label: "Todas" },
  { id: "CLIMA", label: "Clima" },
  { id: "MERCADO", label: "Mercado" },
  { id: "MANEJO", label: "Manejo" },
  { id: "TECNOLOGIA", label: "Tecnologia" },
  { id: "POLITICAS", label: "Políticas" },
  { id: "SUSTENTABILIDADE", label: "Sustentabilidade" },
];

export default function Noticias() {
  const [categoria, setCategoria] = useState("TODAS");
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [previsaoModalAberto, setPrevisaoModalAberto] = useState(false);

  const { data: fazendasRaw } = useFazendaListQuery();
  const fazendas = Array.isArray(fazendasRaw) ? fazendasRaw : [];
  const clima = useChatbotWeather(fazendas);
  const weatherQuery = clima?.weatherQuery;
  const climaData = weatherQuery?.data;
  const climaLoading = Boolean(weatherQuery?.isLoading);
  const climaErro = Boolean(weatherQuery?.isError);

  const noticiasQuery = useNoticiasInfiniteQuery({ categoria, busca, pageSize: 8 });

  const primeiraPagina = noticiasQuery.data?.pages?.[0];
  const destaque = primeiraPagina?.destaque ?? null;
  const categorias = primeiraPagina?.categorias ?? CATEGORIAS_PADRAO;
  const temas = primeiraPagina?.temas ?? [];
  const fontes = primeiraPagina?.fontes ?? [];

  const itensBrutos = useMemo(() => {
    const ids = new Set();
    const lista = [];
    for (const page of noticiasQuery.data?.pages ?? []) {
      for (const item of page.items ?? []) {
        if (ids.has(item.id)) continue;
        ids.add(item.id);
        lista.push(item);
      }
    }
    return lista;
  }, [noticiasQuery.data?.pages]);

  const itens = useMemo(
    () => filtrarNoticiasLocal(itensBrutos, { categoria, busca }),
    [itensBrutos, categoria, busca],
  );

  const totaisPorCategoria = useMemo(() => {
    const map = {};
    for (const tema of temas) map[tema.id] = tema.total;
    return map;
  }, [temas]);

  const totalItems = primeiraPagina?.meta?.totalItems ?? itens.length;
  const hasMore = noticiasQuery.hasNextPage;
  const filtroAtivo = categoria !== "TODAS" || Boolean(busca);
  const categoriaLabel = categorias.find((c) => c.id === categoria)?.label ?? categoria;

  const listaCarregando =
    noticiasQuery.isPending ||
    (noticiasQuery.isFetching &&
      !noticiasQuery.isFetchingNextPage &&
      !(noticiasQuery.data?.pages?.length > 0));

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBusca(buscaInput.trim());
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buscaInput]);

  function aplicarBuscaAgora() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setBusca(buscaInput.trim());
  }

  function handleBuscaKey(e) {
    if (e.key === "Enter") aplicarBuscaAgora();
  }

  function selecionarCategoria(id) {
    setCategoria(id);
  }

  function limparFiltros() {
    setCategoria("TODAS");
    setBuscaInput("");
    setBusca("");
  }

  const erroMsg = noticiasQuery.isError
    ? getApiErrorMessage(noticiasQuery.error, "Não foi possível carregar as notícias.")
    : null;

  useEffect(() => {
    if (!erroMsg) return;
    notify.error(erroMsg, { id: "noticias-erro" });
  }, [erroMsg]);

  const vento = climaData?.current?.wind_speed_10m;
  const chuva = climaData?.current?.precipitation;

  return (
    <>
    <MainLayout hideHeaderInput>
      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">
            Notícias
          </h1>
          <p className="text-[0.95rem] text-gray-500">
            Informações e análises para apoiar suas decisões no campo.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <NoticiaCategoriaChips
              categorias={categorias}
              ativa={categoria}
              totaisPorCategoria={totaisPorCategoria}
              onChange={selecionarCategoria}
            />

            {filtroAtivo ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-500">Filtros:</span>
                {categoria !== "TODAS" ? (
                  <span className="inline-flex items-center rounded-full bg-[var(--agro-brand)]/10 px-3 py-1 font-medium text-[var(--agro-brand)]">
                    {categoriaLabel}
                  </span>
                ) : null}
                {busca ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                    &quot;{busca}&quot;
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs font-semibold text-gray-600 underline-offset-2 hover:text-[var(--agro-brand)] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : null}

            {erroMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-red-800">{erroMsg}</p>
                <p className="mt-2 text-xs text-red-700/90">
                  Verifique se a API está rodando e tente novamente em alguns segundos.
                </p>
                <button
                  type="button"
                  onClick={() => noticiasQuery.refetch()}
                  className="mt-4 inline-flex h-9 items-center rounded-lg bg-[var(--agro-brand)] px-4 text-sm font-semibold text-white hover:opacity-95"
                >
                  Tentar novamente
                </button>
              </div>
            ) : listaCarregando ? (
              <div className="space-y-3" aria-busy="true">
                <p className="text-sm text-gray-500">Carregando notícias dos portais agro…</p>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : (
              <>
                {destaque && categoria === "TODAS" && !busca ? (
                  <section>
                    <NoticiaDestaqueCard noticia={destaque} />
                  </section>
                ) : null}

                <section className="relative">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900">
                    Últimas notícias
                    {filtroAtivo && totalItems > 0 ? (
                      <span className="ml-2 text-sm font-normal text-gray-500">({totalItems})</span>
                    ) : null}
                  </h2>

                  {noticiasQuery.isFetching && !noticiasQuery.isFetchingNextPage ? (
                    <p className="mb-2 text-xs text-gray-500">Atualizando lista…</p>
                  ) : null}

                  {itens.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      Nenhuma notícia encontrada para os filtros selecionados.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {itens.map((noticia) => (
                        <li key={noticia.id}>
                          <NoticiaListaItem noticia={noticia} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => noticiasQuery.fetchNextPage()}
                      disabled={noticiasQuery.isFetchingNextPage}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {noticiasQuery.isFetchingNextPage ? "Carregando…" : "Ver mais notícias"}
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  ) : itens.length > 0 ? (
                    <p className="mt-3 text-center text-xs text-gray-500">
                      {itens.length} de {totalItems} notícias exibidas
                    </p>
                  ) : null}
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={buscaInput}
                onChange={(e) => setBuscaInput(e.target.value)}
                onKeyDown={handleBuscaKey}
                placeholder="Buscar notícias…"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-20 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[var(--agro-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              />
              <button
                type="button"
                onClick={aplicarBuscaAgora}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[var(--agro-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
              >
                Buscar
              </button>
            </div>

            <NoticiasClimaWidget
              location={clima.location}
              temperatura={climaData?.current?.temperature_2m}
              codeClima={climaData?.current?.weather_code}
              umidade={climaData?.current?.relative_humidity_2m}
              vento={vento}
              chuva={chuva}
              isLoading={climaLoading || Boolean(clima?.geocoding)}
              isError={climaErro}
              onVerPrevisaoCompleta={() => setPrevisaoModalAberto(true)}
            />

            <NoticiasTemasWidget
              temas={temas}
              categoriaAtiva={categoria}
              onSelectTema={selecionarCategoria}
            />
            <NoticiasFontesLinks fontes={fontes} />
          </aside>
        </div>
      </div>

    </MainLayout>

      <PrevisaoClimaModal
        open={previsaoModalAberto}
        onClose={() => setPrevisaoModalAberto(false)}
        location={clima?.location}
        fazendaOptions={clima?.fazendaOptions ?? []}
        activeFazendaId={clima?.activeFazendaId ?? ""}
        geocoding={Boolean(clima?.geocoding)}
        geoErro={clima?.geoErro}
        onSelectFazenda={clima?.selectFazenda}
      />
    </>
  );
}
