import centroid from "@turf/centroid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import MapPolygonDeleteConfirm from "./MapPolygonDeleteConfirm.jsx";
import {
  useCreatePoligonoMutation,
  useDeletePoligonoMutation,
  usePoligonosQuery,
  useUpdatePoligonoMutation,
} from "../../queries/poligono/usePoligonoQueries.js";
import AreaSidebar from "./AreaSidebar.jsx";
import CulturaLegend from "./CulturaLegend.jsx";
import PolygonEditor from "./PolygonEditor.jsx";
import PolygonModal from "./PolygonModal.jsx";
import { FAZENDA_SOMENTE_LEITURA_TOOLTIP, podeOperarFazenda } from "../../utils/fazendaOperacao.js";

const PATROCINIO_MG = {
  longitude: -46.9925,
  latitude: -18.9436,
  zoom: 12,
};

const MAP_STYLES = {
  satellite: {
    version: 8,
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
      },
    },
    layers: [{ id: "esri-satellite-layer", type: "raster", source: "esri-satellite" }],
  },
  hybrid: {
    version: 8,
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
      },
      "esri-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
      },
    },
    layers: [
      { id: "esri-satellite-layer", type: "raster", source: "esri-satellite" },
      { id: "esri-labels-layer", type: "raster", source: "esri-labels" },
    ],
  },
  streets: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm-layer", type: "raster", source: "osm" }],
  },
};

export default function MapView({ fazendaId, fazenda }) {
  const mapRef = useRef(null);
  const podeOperar = podeOperarFazenda(fazenda);
  const bloqueioTitulo = !podeOperar ? FAZENDA_SOMENTE_LEITURA_TOOLTIP : undefined;

  const [viewState, setViewState] = useState({
    longitude: PATROCINIO_MG.longitude,
    latitude: PATROCINIO_MG.latitude,
    zoom: PATROCINIO_MG.zoom,
  });

  const [tipoMapa, setTipoMapa] = useState("hybrid");

  const [buscaTexto, setBuscaTexto] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const buscaRef = useRef(null);
  const debounceRef = useRef(null);

  const [modo, setModo] = useState("view");
  const [poligonoSelecionadoId, setPoligonoSelecionadoId] = useState(null);
  const [culturaFiltro, setCulturaFiltro] = useState(null);

  const [pendingGeojson, setPendingGeojson] = useState(null);
  const [pendingArea, setPendingArea] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalInitialData, setModalInitialData] = useState(null);

  const [excluirAlvo, setExcluirAlvo] = useState(null);
  const [excluirBusy, setExcluirBusy] = useState(false);

  const { data: poligonos = [], isLoading } = usePoligonosQuery(fazendaId);
  const createMutation = useCreatePoligonoMutation(fazendaId);
  const updateMutation = useUpdatePoligonoMutation(fazendaId);
  const deleteMutation = useDeletePoligonoMutation(fazendaId);

  const poligonoSelecionado = useMemo(
    () => poligonos.find((p) => p.id === poligonoSelecionadoId) ?? null,
    [poligonos, poligonoSelecionadoId],
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setBuscaAberta(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleBuscaChange(e) {
    const valor = e.target.value;
    setBuscaTexto(valor);
    clearTimeout(debounceRef.current);
    if (!valor.trim()) {
      setResultadosBusca([]);
      setBuscaAberta(false);
      return;
    }
    setBuscandoLocal(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(valor)}&format=json&addressdetails=1&limit=6&countrycodes=br`,
          { headers: { "Accept-Language": "pt-BR" } },
        );
        const data = await res.json();
        setResultadosBusca(data);
        setBuscaAberta(data.length > 0);
      } catch {
        setResultadosBusca([]);
      } finally {
        setBuscandoLocal(false);
      }
    }, 400);
  }

  function handleSelecionarLocal(resultado) {
    const lat = parseFloat(resultado.lat);
    const lon = parseFloat(resultado.lon);
    const zoom = resultado.type === "city" || resultado.type === "town" ? 12 : resultado.type === "state" ? 7 : 14;
    setViewState({ longitude: lon, latitude: lat, zoom });
    setBuscaTexto(resultado.display_name.split(",")[0]);
    setBuscaAberta(false);
    setResultadosBusca([]);
  }

  function centrarNoPoligono(poligono) {
    if (!poligono?.geometria) return;
    try {
      const c = centroid(poligono.geometria);
      const [lng, lat] = c.geometry.coordinates;
      setViewState((prev) => ({ ...prev, longitude: lng, latitude: lat, zoom: 15 }));
    } catch {
      /* silencia */
    }
  }

  const handlePoligonoSelect = useCallback(
    (id) => {
      setPoligonoSelecionadoId(id);
      if (modo !== "draw") {
        const pol = poligonos.find((p) => p.id === id);
        if (pol) centrarNoPoligono(pol);
      }
    },
    [modo, poligonos],
  );

  function handleCriarArea() {
    if (!podeOperar) return;
    setPoligonoSelecionadoId(null);
    setModo("draw");
  }

  function handlePoligonoCreated({ geojson, areaHectares }) {
    setPendingGeojson(geojson);
    setPendingArea(areaHectares);
    setModalMode("create");
    setModalInitialData(null);
    setModalOpen(true);
    setModo("view");
  }

  async function handleModalSubmit({ nome, cultura_id, data_plantio, data_colheita }) {
    if (modalMode === "create" && pendingGeojson) {
      await createMutation.mutateAsync({
        fazenda_id: fazendaId,
        nome,
        geojson: pendingGeojson,
        cultura_id,
        data_plantio,
        data_colheita,
      });
      setPendingGeojson(null);
      setPendingArea(null);
    } else if (modalMode === "edit" && poligonoSelecionadoId) {
      await updateMutation.mutateAsync({
        id: poligonoSelecionadoId,
        payload: { nome, cultura_id, data_plantio, data_colheita },
      });
    }
    setModalOpen(false);
  }

  function handleEditarPoligono(poligono) {
    setPoligonoSelecionadoId(poligono.id);
    setModalMode("edit");
    setModalInitialData({
      nome: poligono.nome,
      cultura_id: poligono.cultura_id ?? "",
      data_plantio: poligono.data_plantio,
      data_colheita: poligono.data_colheita,
    });
    setModalOpen(true);
  }

  function handleExcluirPoligono(poligono) {
    setExcluirAlvo(poligono);
  }

  async function handleConfirmExcluirPoligono() {
    if (!excluirAlvo) return;
    setExcluirBusy(true);
    try {
      await deleteMutation.mutateAsync(excluirAlvo.id);
      if (poligonoSelecionadoId === excluirAlvo.id) setPoligonoSelecionadoId(null);
      setExcluirAlvo(null);
    } finally {
      setExcluirBusy(false);
    }
  }

  function handleVerticesUpdated(id, geojson) {
    updateMutation.mutate({ id, payload: { geojson } });
  }

  function handleExportarGeoJSON() {
    if (poligonos.length === 0) return;
    const featureCollection = {
      type: "FeatureCollection",
      features: poligonos.map((p) => ({
        type: "Feature",
        geometry: p.geometria,
        properties: {
          id: p.id,
          nome: p.nome,
          area_hectares: Number(p.area_hectares),
          cultura_nome: p.cultura_nome,
          cultura_cor: p.cultura_cor,
          data_plantio: p.data_plantio,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fazenda-${fazenda?.nome ?? fazendaId}-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isSaving =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const mapUiPausado = modalOpen || Boolean(excluirAlvo);

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[400px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <MapPolygonDeleteConfirm
        open={Boolean(excluirAlvo)}
        poligono={excluirAlvo}
        loading={excluirBusy}
        onClose={() => {
          if (excluirBusy) return;
          setExcluirAlvo(null);
        }}
        onConfirm={handleConfirmExcluirPoligono}
      />

      <PolygonModal
        open={modalOpen}
        mode={modalMode}
        initialData={modalInitialData}
        areaHectares={modalMode === "create" ? pendingArea : poligonoSelecionado?.area_hectares}
        onClose={() => {
          setModalOpen(false);
          if (modalMode === "create") {
            setPendingGeojson(null);
            setPendingArea(null);
          }
        }}
        onSubmit={handleModalSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-hidden">
        <AreaSidebar
          poligonos={poligonos}
          poligonoSelecionadoId={poligonoSelecionadoId}
          onPoligonoSelect={handlePoligonoSelect}
          onCriarArea={handleCriarArea}
          onEditarPoligono={podeOperar ? handleEditarPoligono : undefined}
          onExcluirPoligono={podeOperar ? handleExcluirPoligono : undefined}
          modoEdicao={modo}
          somenteLeitura={!podeOperar}
          bloqueioTitulo={bloqueioTitulo}
        />
      </div>

      {/* Mapa */}
      <div className="map-view-pane relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-white/60">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--agro-brand)] border-t-transparent" />
          </div>
        )}

        {isSaving && !mapUiPausado && (
          <div className="absolute right-4 top-4 z-[5] rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Salvando…
          </div>
        )}

        {/* Header do mapa */}
        <div
          className={`absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3 gap-3 transition-opacity ${
            mapUiPausado ? "pointer-events-none z-0 opacity-0" : "z-[5]"
          }`}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            {modo === "view" && poligonoSelecionado && podeOperar && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModo("edit");
                  }}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                >
                  Editar vértices
                </button>
                <button
                  type="button"
                  onClick={() => setPoligonoSelecionadoId(null)}
                  className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                >
                  Desselecionar
                </button>
              </>
            )}

            {modo === "edit" && (
              <button
                type="button"
                onClick={() => setModo("view")}
                className="rounded-lg bg-[var(--agro-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Concluir edição
              </button>
            )}

            {modo === "draw" && (
              <button
                type="button"
                onClick={() => setModo("view")}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Cancelar desenho
              </button>
            )}
          </div>

          {/* Barra de pesquisa */}
          <div ref={buscaRef} className="relative flex-1 max-w-sm">
            <div className="flex items-center rounded-lg bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">
              <span className="pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={buscaTexto}
                onChange={handleBuscaChange}
                onFocus={() => resultadosBusca.length > 0 && setBuscaAberta(true)}
                placeholder="Buscar cidade, rua, BR…"
                className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              {buscandoLocal && (
                <div className="pr-3">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--agro-brand)] border-t-transparent" />
                </div>
              )}
              {buscaTexto && !buscandoLocal && (
                <button
                  type="button"
                  onClick={() => { setBuscaTexto(""); setResultadosBusca([]); setBuscaAberta(false); }}
                  className="pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {buscaAberta && resultadosBusca.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-[6] mt-1 max-h-60 overflow-y-auto overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
                {resultadosBusca.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelecionarLocal(r)}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors flex items-start gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0 text-[var(--agro-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        <span className="font-medium">{r.display_name.split(",")[0]}</span>
                        <span className="text-gray-400 text-xs block truncate">
                          {r.display_name.split(",").slice(1).join(",").trim()}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Toggle tipo de mapa */}
            <div className="flex rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm border border-white/20">
              {[
                { key: "satellite", label: "Satélite" },
                { key: "hybrid", label: "Híbrido" },
                { key: "streets", label: "Ruas" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipoMapa(key)}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    tipoMapa === key
                      ? "bg-white text-gray-900"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {poligonos.length > 0 && (
              <button
                type="button"
                onClick={handleExportarGeoJSON}
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                title="Exportar GeoJSON"
              >
                Exportar GeoJSON
              </button>
            )}
          </div>
        </div>

        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          mapStyle={MAP_STYLES[tipoMapa]}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={["poligonos-fill"]}
        >
          <NavigationControl position="bottom-right" />

          <PolygonEditor
            poligonos={poligonos}
            modo={modo}
            poligonoSelecionadoId={poligonoSelecionadoId}
            culturaFiltro={culturaFiltro}
            onPoligonoClick={handlePoligonoSelect}
            onPoligonoCreated={handlePoligonoCreated}
            onPoligonoVerticesUpdated={handleVerticesUpdated}
          />
        </Map>

        {/* Legenda de culturas */}
        <div
          className={`absolute bottom-8 left-4 right-20 transition-opacity ${
            mapUiPausado ? "pointer-events-none z-0 opacity-0" : "z-[5]"
          }`}
        >
          <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-sm">
            <CulturaLegend culturaFiltro={culturaFiltro} onCulturaFilter={setCulturaFiltro} />
          </div>
        </div>
      </div>
    </div>
  );
}
