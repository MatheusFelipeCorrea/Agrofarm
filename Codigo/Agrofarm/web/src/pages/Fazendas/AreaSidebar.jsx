import { useMemo, useState } from "react";
import { ChevronDownIcon } from "../../components/ui/icons.jsx";
import { useCulturaListQuery } from "../../queries/cultura/useCulturaQueries.js";
import AreaCard from "./AreaCard.jsx";

export default function AreaSidebar({
  poligonos,
  poligonoSelecionadoId,
  onPoligonoSelect,
  onCriarArea,
  onEditarPoligono,
  onExcluirPoligono,
  modoEdicao,
  somenteLeitura = false,
  bloqueioTitulo,
}) {
  const [busca, setBusca] = useState("");
  const [culturaFiltro, setCulturaFiltro] = useState("");
  const { data: culturas = [] } = useCulturaListQuery();

  const poligonosFiltrados = useMemo(() => {
    return poligonos.filter((p) => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCultura = !culturaFiltro || p.cultura_id === culturaFiltro;
      return matchBusca && matchCultura;
    });
  }, [poligonos, busca, culturaFiltro]);

  const areaTotal = useMemo(
    () => poligonosFiltrados.reduce((sum, p) => sum + Number(p.area_hectares), 0),
    [poligonosFiltrados],
  );

  const temFiltros = busca || culturaFiltro;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Áreas da fazenda</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {poligonosFiltrados.length}{" "}
              {poligonosFiltrados.length === 1 ? "área" : "áreas"}
              {poligonosFiltrados.length > 0 && (
                <span className="ml-1">• {areaTotal.toFixed(2)} ha total</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCriarArea}
            disabled={somenteLeitura || modoEdicao === "draw"}
            title={somenteLeitura ? bloqueioTitulo : undefined}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--agro-brand)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--agro-brand-dark)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>+</span>
            Criar área
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3 space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar áreas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 text-sm focus:border-[var(--agro-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--agro-brand)]"
          />
        </div>

        <div className="relative">
          <select
            value={culturaFiltro}
            onChange={(e) => setCulturaFiltro(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-700 focus:border-[var(--agro-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--agro-brand)]"
          >
            <option value="">Filtrar por cultura</option>
            {culturas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {temFiltros && (
          <button
            type="button"
            className="text-xs text-[var(--agro-brand)] hover:underline"
            onClick={() => {
              setBusca("");
              setCulturaFiltro("");
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {poligonosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <p className="text-sm text-gray-500">
              {temFiltros ? "Nenhuma área encontrada" : "Nenhuma área cadastrada"}
            </p>
            {!temFiltros && !somenteLeitura && (
              <p className="mt-1 text-xs text-gray-400">
                Clique em &quot;Criar área&quot; para desenhar a primeira área no mapa
              </p>
            )}
            {somenteLeitura && (
              <p className="mt-1 text-xs text-gray-400">{bloqueioTitulo}</p>
            )}
          </div>
        ) : (
          poligonosFiltrados.map((p) => (
            <AreaCard
              key={p.id}
              poligono={p}
              selecionado={p.id === poligonoSelecionadoId}
              onClick={() => onPoligonoSelect?.(p.id)}
              onEditar={() => onEditarPoligono?.(p)}
              onExcluir={() => onExcluirPoligono?.(p)}
              somenteLeitura={somenteLeitura}
              bloqueioTitulo={bloqueioTitulo}
            />
          ))
        )}
      </div>

      {poligonos.length > 0 && !somenteLeitura && (
        <div className="border-t border-gray-100 px-4 py-2">
          <button
            type="button"
            onClick={onCriarArea}
            disabled={modoEdicao === "draw"}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-[var(--agro-brand)] hover:text-[var(--agro-brand)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>+</span>
            Adicionar mais áreas
          </button>
        </div>
      )}
    </div>
  );
}
