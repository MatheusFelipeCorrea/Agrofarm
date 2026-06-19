import area from "@turf/area";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/maplibre";
import { validarPoligono } from "../../utils/validatePolygon.js";

const COR_PADRAO = "#94A3B8";
const COR_PREVIEW = "#3B82F6";
const COR_ERRO = "#EF4444";

function buildGeoJSON(coords, fechar = false) {
  if (coords.length < 2) return null;
  const ring = fechar ? [...coords, coords[0]] : coords;
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: ring },
  };
}

function buildPolygonGeoJSON(coords, cor) {
  if (coords.length < 3) return null;
  const ring = [...coords, coords[0]];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: { cor },
  };
}

function calcularArea(coords) {
  if (coords.length < 3) return 0;
  const geojson = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
  };
  return (area(geojson) / 10000).toFixed(2);
}

function distancia(a, b) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export default function PolygonEditor({
  poligonos,
  modo,
  poligonoSelecionadoId,
  culturaFiltro,
  onPoligonoClick,
  onPoligonoCreated,
  onPoligonoVerticesUpdated,
}) {
  const { current: map } = useMap();

  const [vertices, setVertices] = useState([]);
  const [cursorPos, setCursorPos] = useState(null);
  const [erroGeo, setErroGeo] = useState(null);
  const [editVertices, setEditVertices] = useState([]);
  const draggingIdx = useRef(null);

  useEffect(() => {
    if (modo !== "draw") {
      setVertices([]);
      setCursorPos(null);
      setErroGeo(null);
    }
    if (modo !== "edit") {
      setEditVertices([]);
    }
  }, [modo]);

  useEffect(() => {
    if (modo === "edit" && poligonoSelecionadoId) {
      const pol = poligonos.find((p) => p.id === poligonoSelecionadoId);
      if (pol?.geometria?.coordinates?.[0]) {
        const ring = pol.geometria.coordinates[0];
        setEditVertices(ring.slice(0, -1));
      }
    }
  }, [modo, poligonoSelecionadoId, poligonos]);

  const handleMapClick = useCallback(
    (e) => {
      if (modo !== "draw") return;
      const { lng, lat } = e.lngLat;
      const newCoord = [lng, lat];

      setVertices((prev) => {
        if (prev.length >= 3) {
          const primeiro = prev[0];
          const screen1 = map?.project(primeiro);
          const screen2 = map?.project(newCoord);
          if (screen1 && screen2) {
            const dx = screen1.x - screen2.x;
            const dy = screen1.y - screen2.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
              fecharPoligono(prev);
              return prev;
            }
          }
        }
        return [...prev, newCoord];
      });
    },
    [modo, map],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (modo === "draw") {
        setCursorPos([e.lngLat.lng, e.lngLat.lat]);
      }
    },
    [modo],
  );

  function fecharPoligono(coords) {
    if (coords.length < 3) return;
    const geojson = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
    };
    const validacao = validarPoligono(geojson);
    if (!validacao.valido) {
      setErroGeo(validacao.erro);
      return;
    }
    setErroGeo(null);
    const areaHa = calcularArea(coords);
    onPoligonoCreated?.({ geojson, areaHectares: areaHa });
    setVertices([]);
    setCursorPos(null);
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modo === "draw" && e.key === "Enter") {
        fecharPoligono(vertices);
      }
      if (modo === "draw" && e.key === "Escape") {
        setVertices([]);
        setCursorPos(null);
        setErroGeo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modo, vertices]);

  useEffect(() => {
    if (!map) return;
    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    return () => {
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [map, handleMapClick, handleMouseMove]);

  useEffect(() => {
    if (!map) return;
    map.getCanvas().style.cursor = modo === "draw" ? "crosshair" : "";
  }, [map, modo]);

  const poligonosFiltrados = useMemo(() => {
    if (!culturaFiltro) return poligonos;
    return poligonos.filter((p) => p.cultura_id === culturaFiltro);
  }, [poligonos, culturaFiltro]);

  const geojsonPoligonos = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: poligonosFiltrados.map((p) => ({
        type: "Feature",
        id: p.id,
        geometry: p.geometria,
        properties: {
          id: p.id,
          cor: p.cultura_cor ?? COR_PADRAO,
          selecionado: p.id === poligonoSelecionadoId,
        },
      })),
    };
  }, [poligonosFiltrados, poligonoSelecionadoId]);

  const previewPoligono = useMemo(() => {
    if (modo !== "draw" || vertices.length < 3) return null;
    return buildPolygonGeoJSON(vertices, COR_PREVIEW);
  }, [modo, vertices]);

  const previewLinha = useMemo(() => {
    if (modo !== "draw" || vertices.length === 0) return null;
    const coords = cursorPos ? [...vertices, cursorPos] : vertices;
    return buildGeoJSON(coords);
  }, [modo, vertices, cursorPos]);

  function handleVertexDragEnd(idx, e) {
    const { lng, lat } = e.lngLat;
    const updated = editVertices.map((v, i) => (i === idx ? [lng, lat] : v));
    setEditVertices(updated);
    const ring = [...updated, updated[0]];
    const geojson = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
    };
    onPoligonoVerticesUpdated?.(poligonoSelecionadoId, geojson);
  }

  const handlePolygonClick = useCallback(
    (e) => {
      if (modo !== "view" && modo !== "edit") return;
      const features = map?.queryRenderedFeatures(e.point, { layers: ["poligonos-fill"] });
      if (features?.length > 0) {
        const id = features[0].properties?.id;
        onPoligonoClick?.(id);
        e.originalEvent?.stopPropagation();
      }
    },
    [map, modo, onPoligonoClick],
  );

  useEffect(() => {
    if (!map) return;
    map.on("click", "poligonos-fill", handlePolygonClick);
    return () => map.off("click", "poligonos-fill", handlePolygonClick);
  }, [map, handlePolygonClick]);

  const previewArea = modo === "draw" && vertices.length >= 3 ? calcularArea(vertices) : null;

  return (
    <>
      {/* Polígonos salvos */}
      <Source id="poligonos" type="geojson" data={geojsonPoligonos}>
        <Layer
          id="poligonos-fill"
          type="fill"
          paint={{
            "fill-color": ["get", "cor"],
            "fill-opacity": [
              "case",
              ["==", ["get", "selecionado"], true],
              0.5,
              culturaFiltro ? 0.4 : 0.35,
            ],
          }}
        />
        <Layer
          id="poligonos-border"
          type="line"
          paint={{
            "line-color": ["get", "cor"],
            "line-width": ["case", ["==", ["get", "selecionado"], true], 3, 2],
            "line-opacity": 0.9,
          }}
        />
      </Source>

      {/* Preview do polígono em desenho */}
      {previewPoligono && (
        <Source id="preview-polygon" type="geojson" data={previewPoligono}>
          <Layer
            id="preview-polygon-fill"
            type="fill"
            paint={{ "fill-color": erroGeo ? COR_ERRO : COR_PREVIEW, "fill-opacity": 0.2 }}
          />
        </Source>
      )}

      {/* Linha de preview */}
      {previewLinha && (
        <Source id="preview-line" type="geojson" data={previewLinha}>
          <Layer
            id="preview-line-layer"
            type="line"
            paint={{
              "line-color": erroGeo ? COR_ERRO : COR_PREVIEW,
              "line-width": 2,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      )}

      {/* Vértices do modo de desenho */}
      {modo === "draw" &&
        vertices.map((coord, idx) => (
          <Marker key={`v-draw-${idx}`} longitude={coord[0]} latitude={coord[1]} anchor="center">
            <div
              className={`h-3 w-3 rounded-full border-2 border-white shadow-md ${
                idx === 0 ? "bg-blue-400 cursor-pointer" : "bg-blue-600"
              }`}
              onClick={idx === 0 && vertices.length >= 3 ? () => fecharPoligono(vertices) : undefined}
              title={idx === 0 ? "Clique para fechar o polígono" : undefined}
            />
          </Marker>
        ))}

      {/* Vértices arrastáveis no modo edição */}
      {modo === "edit" &&
        editVertices.map((coord, idx) => (
          <Marker
            key={`v-edit-${idx}`}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => handleVertexDragEnd(idx, e)}
          >
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400 shadow-md cursor-grab active:cursor-grabbing" />
          </Marker>
        ))}

      {/* Tooltip de área em preview */}
      {modo === "draw" && cursorPos && previewArea && (
        <Marker longitude={cursorPos[0]} latitude={cursorPos[1]} anchor="bottom">
          <div className="pointer-events-none rounded bg-black/70 px-2 py-1 text-xs text-white whitespace-nowrap mb-1">
            {previewArea} ha
          </div>
        </Marker>
      )}

      {/* Erro de geometria */}
      {erroGeo && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg pointer-events-none">
          {erroGeo}
        </div>
      )}

      {/* Instruções de desenho */}
      {modo === "draw" && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-xs text-white pointer-events-none whitespace-nowrap">
          {vertices.length === 0
            ? "Clique no mapa para adicionar vértices"
            : vertices.length < 3
              ? `${vertices.length} vértice(s) — mínimo 3 para fechar`
              : "Clique no 1º vértice ou pressione Enter para fechar • Esc para cancelar"}
        </div>
      )}

      {modo === "edit" && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-xs text-white pointer-events-none whitespace-nowrap">
          Arraste os vértices amarelos para editar a geometria
        </div>
      )}
    </>
  );
}
