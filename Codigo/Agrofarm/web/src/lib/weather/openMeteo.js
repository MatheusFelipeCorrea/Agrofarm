import { weatherCodeLabel } from "./weatherCodes.js";

export { weatherCodeLabel };

export async function fetchWeatherForecast(lat, lon, forecastDays = 7) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "America/Sao_Paulo",
    forecast_days: String(forecastDays),
    current:
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    hourly: "temperature_2m,precipitation_probability,weather_code",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Previsão indisponível");
  return res.json();
}

function formatarDiaSemana(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const alvo = new Date(d);
  alvo.setHours(12, 0, 0, 0);
  const diff = Math.round((alvo - hoje) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

export function normalizarPrevisaoCompleta(data) {
  const daily = data?.daily ?? {};
  const hourly = data?.hourly ?? {};
  const times = daily.time ?? [];

  const dias = times.map((date, i) => ({
    date,
    label: formatarDiaSemana(date),
    code: daily.weather_code?.[i],
    condicao: weatherCodeLabel(daily.weather_code?.[i]),
    tempMax: daily.temperature_2m_max?.[i],
    tempMin: daily.temperature_2m_min?.[i],
    chuvaMm: daily.precipitation_sum?.[i],
    chuvaProb: daily.precipitation_probability_max?.[i],
    ventoMax: daily.wind_speed_10m_max?.[i],
  }));

  const hojeIso = new Date().toISOString().slice(0, 10);
  const horas = (hourly.time ?? [])
    .map((time, i) => ({ time, i }))
    .filter(({ time }) => String(time).startsWith(hojeIso))
    .slice(0, 12)
    .map(({ time, i }) => ({
      time,
      hora: time?.slice(11, 16) ?? "",
      temp: hourly.temperature_2m?.[i],
      chuvaProb: hourly.precipitation_probability?.[i],
      code: hourly.weather_code?.[i],
      condicao: weatherCodeLabel(hourly.weather_code?.[i]),
    }));

  const current = data?.current ?? {};

  return {
    atualizadoEm: data?.current?.time ?? hourly.time?.[0] ?? null,
    atual: {
      temperatura: current.temperature_2m,
      umidade: current.relative_humidity_2m,
      vento: current.wind_speed_10m,
      chuva: current.precipitation,
      code: current.weather_code,
      condicao: weatherCodeLabel(current.weather_code),
    },
    dias,
    proximasHoras: horas,
  };
}
