import { useQuery } from "@tanstack/react-query";
import { fetchWeatherForecast, normalizarPrevisaoCompleta } from "../../lib/weather/openMeteo.js";

export function useWeatherForecastQuery({ lat, lon, enabled = true } = {}) {
  const podeBuscar = enabled && Number.isFinite(lat) && Number.isFinite(lon);

  return useQuery({
    queryKey: ["weather", "forecast", lat, lon],
    queryFn: async () => {
      const raw = await fetchWeatherForecast(lat, lon);
      return normalizarPrevisaoCompleta(raw);
    },
    enabled: podeBuscar,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
