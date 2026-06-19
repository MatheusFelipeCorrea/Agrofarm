import { useCallback, useEffect, useRef, useState } from "react";

export async function nominatimSearch(query, limit = 6) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}&countrycodes=br`,
    { headers: { "Accept-Language": "pt-BR" } },
  );
  if (!res.ok) throw new Error("Busca indisponível");
  return res.json();
}

export function mapNominatimResult(hit) {
  if (!hit) return null;
  return {
    label: hit.display_name,
    shortLabel: hit.display_name.split(",")[0].trim(),
    latitude: parseFloat(hit.lat),
    longitude: parseFloat(hit.lon),
  };
}

/**
 * Busca de localização via Nominatim (mesmo padrão do chatbot/clima).
 */
export function useGeocodingSearch({ minChars = 3, debounceMs = 400 } = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (text) => {
    const q = (text ?? "").trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await nominatimSearch(q, 6);
      setResults(
        data.map((hit) => ({
          id: hit.place_id,
          ...mapNominatimResult(hit),
        })),
      );
    } catch (err) {
      setError(err?.message ?? "Busca indisponível");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [minChars]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    debounceRef.current = setTimeout(() => search(q), debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, minChars, debounceMs, search]);

  const reset = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    reset,
    searchNow: search,
  };
}
