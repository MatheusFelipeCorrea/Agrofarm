import centroid from "@turf/centroid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarPoligonos } from "../../services/poligono/poligono.service.js";

const STORAGE_KEY = "agrofarm-chatbot-weather-v1";
const GEO_CACHE_KEY = "agrofarm-weather-geocode-v1";

const DEFAULT_LOCATION = {
  id: "default:patrocinio",
  label: "Patrocínio, MG",
  lat: -18.9439,
  lon: -46.9928,
  source: "default",
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privado */
  }
}

function loadActiveLocation() {
  const saved = readJson(STORAGE_KEY, null);
  if (saved?.lat != null && saved?.lon != null && saved?.label) {
    if (saved.id === "default:brasilia") return DEFAULT_LOCATION;
    return saved;
  }
  return DEFAULT_LOCATION;
}

async function nominatimSearch(query, limit = 6) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}&countrycodes=br`,
    { headers: { "Accept-Language": "pt-BR" } },
  );
  if (!res.ok) throw new Error("Busca indisponível");
  return res.json();
}

async function geocodeQuery(query) {
  const data = await nominatimSearch(query, 1);
  const hit = data[0];
  if (!hit) return null;
  return {
    lat: parseFloat(hit.lat),
    lon: parseFloat(hit.lon),
    label: hit.display_name.split(",")[0].trim() || query,
  };
}

function readGeoCache() {
  return readJson(GEO_CACHE_KEY, {});
}

function writeGeoCacheEntry(fazendaId, coords) {
  const cache = readGeoCache();
  cache[fazendaId] = { ...coords, at: Date.now() };
  writeJson(GEO_CACHE_KEY, cache);
}

async function coordsFromPoligonosFazenda(fazendaId) {
  try {
    const poligonos = await listarPoligonos(fazendaId);
    if (!Array.isArray(poligonos) || poligonos.length === 0) return null;

    for (const pol of poligonos) {
      if (!pol?.geometria) continue;
      try {
        const c = centroid(pol.geometria);
        const [lon, lat] = c.geometry.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return { lat, lon, source: "poligono" };
        }
      } catch {
        /* próximo polígono */
      }
    }
  } catch {
    /* fallback para geocoding */
  }
  return null;
}

async function resolveFazendaCoords(fazenda) {
  const cache = readGeoCache();
  const cached = cache[fazenda.id];
  if (cached?.lat != null && cached?.lon != null) {
    return {
      lat: cached.lat,
      lon: cached.lon,
      label: cached.label ?? formatFazendaLocationLabel(fazenda),
    };
  }

  const fromPoly = await coordsFromPoligonosFazenda(fazenda.id);
  const labelFazenda = formatFazendaLocationLabel(fazenda);

  if (fromPoly) {
    writeGeoCacheEntry(fazenda.id, { lat: fromPoly.lat, lon: fromPoly.lon, label: labelFazenda });
    return { lat: fromPoly.lat, lon: fromPoly.lon, label: labelFazenda };
  }

  const q = [fazenda.localizacao?.trim(), fazenda.nome?.trim(), "Brasil"].filter(Boolean).join(", ");
  const hit = await geocodeQuery(q);
  if (!hit) return null;

  writeGeoCacheEntry(fazenda.id, { lat: hit.lat, lon: hit.lon, label: labelFazenda });
  return { lat: hit.lat, lon: hit.lon, label: labelFazenda };
}

function formatFazendaLocationLabel(fazenda) {
  const loc = fazenda.localizacao?.trim();
  const nome = fazenda.nome?.trim() || "Fazenda";
  return loc ? `${nome} — ${loc}` : nome;
}

async function fetchOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=America%2FSao_Paulo`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Clima indisponível");
  return r.json();
}

export { weatherCodeLabel } from "../../lib/weather/weatherCodes.js";

export function useChatbotWeather(fazendas = []) {
  const [location, setLocation] = useState(loadActiveLocation);
  const [geocoding, setGeocoding] = useState(false);
  const [geoErro, setGeoErro] = useState(null);

  const [buscaTexto, setBuscaTexto] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);
  const buscaRef = useRef(null);

  const persistLocation = useCallback((next) => {
    setLocation(next);
    writeJson(STORAGE_KEY, next);
    setGeoErro(null);
  }, []);

  const weatherQuery = useQuery({
    queryKey: ["weather", location.lat, location.lon],
    queryFn: () => fetchOpenMeteo(location.lat, location.lon),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
    enabled: Number.isFinite(location.lat) && Number.isFinite(location.lon),
  });

  const fazendaOptions = useMemo(
    () =>
      (fazendas ?? [])
        .filter((f) => f?.id)
        .map((f) => ({
          id: f.id,
          nome: f.nome,
          localizacao: f.localizacao?.trim() || null,
        })),
    [fazendas],
  );

  const selectFazenda = useCallback(
    async (fazendaId) => {
      const fazenda = fazendas.find((f) => f.id === fazendaId);
      if (!fazenda) return;

      setGeocoding(true);
      setGeoErro(null);
      try {
        const coords = await resolveFazendaCoords(fazenda);
        if (!coords) {
          setGeoErro("Não foi possível localizar esta fazenda. Use a busca abaixo.");
          return;
        }
        persistLocation({
          id: `fazenda:${fazenda.id}`,
          label: coords.label,
          lat: coords.lat,
          lon: coords.lon,
          source: "fazenda",
          fazendaId: fazenda.id,
        });
      } finally {
        setGeocoding(false);
      }
    },
    [fazendas, persistLocation],
  );

  const selectSearchResult = useCallback(
    (hit) => {
      const lat = parseFloat(hit.lat);
      const lon = parseFloat(hit.lon);
      const label = hit.display_name.split(",")[0].trim();
      persistLocation({
        id: `search:${lat},${lon}`,
        label,
        lat,
        lon,
        source: "search",
      });
      setBuscaTexto("");
      setResultadosBusca([]);
      setBuscaAberta(false);
    },
    [persistLocation],
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

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const valor = buscaTexto.trim();
    if (!valor) {
      setResultadosBusca([]);
      setBuscaAberta(false);
      return;
    }

    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await nominatimSearch(valor, 6);
        setResultadosBusca(data);
        setBuscaAberta(data.length > 0);
      } catch {
        setResultadosBusca([]);
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [buscaTexto]);

  const activeFazendaId =
    location.source === "fazenda" && location.fazendaId ? location.fazendaId : "";

  const atualizadoEm = weatherQuery.dataUpdatedAt
    ? new Date(weatherQuery.dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return {
    location,
    weatherQuery,
    fazendaOptions,
    activeFazendaId,
    geocoding,
    geoErro,
    selectFazenda,
    selectSearchResult,
    persistLocation,
    buscaTexto,
    setBuscaTexto,
    buscaAberta,
    resultadosBusca,
    buscando,
    buscaRef,
    atualizadoEm,
  };
}
