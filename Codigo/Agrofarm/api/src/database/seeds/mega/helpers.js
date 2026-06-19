import prisma from "../../client.js";

export const PATROCINIO = {
  cidade: "Patrocinio, MG",
  lat: -18.9439,
  lon: -46.9928,
};

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function dateOnly(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function between(min, max) {
  return min + Math.random() * (max - min);
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Retangulo simples em WGS84 para talhoes na regiao de Patrocinio. */
export function talhaoPolygon(baseLon, baseLat, offsetLon = 0, offsetLat = 0, size = 0.012) {
  const lon = baseLon + offsetLon;
  const lat = baseLat + offsetLat;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lon, lat],
        [lon + size, lat],
        [lon + size, lat + size * 0.85],
        [lon, lat + size * 0.85],
        [lon, lat],
      ],
    ],
  };
}

export async function insertPoligono({
  fazendaId,
  culturaId,
  nome,
  geojson,
  areaHectares,
  dataPlantio,
  criadoPor,
}) {
  const geojsonString = JSON.stringify(geojson);
  const rows = await prisma.$queryRaw`
    INSERT INTO poligonos_fazenda (
      fazenda_id, nome, geometria, area_hectares, cultura_id, data_plantio, criado_por
    )
    VALUES (
      ${fazendaId}::uuid,
      ${nome},
      ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326),
      ${areaHectares},
      ${culturaId}::uuid,
      ${dataPlantio}::date,
      ${criadoPor}::uuid
    )
    RETURNING id
  `;
  return rows[0].id;
}

export async function insertPoligonoHistorico({
  fazendaId,
  culturaId,
  colheitaId,
  nome,
  geojson,
  areaHectares,
  status,
  dataPlantio,
  dataColheita,
}) {
  const geojsonString = JSON.stringify(geojson);
  const rows = await prisma.$queryRaw`
    INSERT INTO poligonos_fazenda_historico (
      fazenda_id, nome, geometria, area_hectares, cultura_id, colheita_id,
      data_plantio, data_colheita, status
    )
    VALUES (
      ${fazendaId}::uuid,
      ${nome},
      ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326),
      ${areaHectares},
      ${culturaId}::uuid,
      ${colheitaId}::uuid,
      ${dataPlantio}::date,
      ${dataColheita}::date,
      ${status}::status_historico_mapa
    )
    RETURNING id
  `;
  return rows[0].id;
}

export const COMPRADORES_EXPORT = [
  "AgriExport Global SA",
  "Continental Grain Trading",
  "Nordic Commodities Ltd",
  "Exportadora Santos Lima",
];

export const COMPRADORES_DOMESTICOS = [
  "Cargill Brasil",
  "Bunge Alimentos",
  "Cooperativa Regional Patrocinio",
  "Mercado Interno MG",
  "Usina Central Energia",
];

export const TIPOS_GASTO = [
  "SEMENTES",
  "FERTILIZANTE",
  "DEFENSIVO",
  "COMBUSTIVEL",
  "MAO_DE_OBRA",
  "MANUTENCAO",
  "ENERGIA",
  "ARRENDAMENTO",
  "OUTROS",
];

export const CATEGORIAS_INSUMO = ["FERTILIZANTE", "DEFENSIVO", "SEMENTE", "OUTRO"];

export const ITENS_INSUMO = {
  FERTILIZANTE: ["Ureia 46%", "MAP 11-52-00", "KCl 60%", "Super Simples"],
  DEFENSIVO: ["Glifosato 480", "Lambda-Cialotrina", "Mancozeb 800", "Triciclazol"],
  SEMENTE: ["Soja RR", "Milho VT PRO3", "Feijao Carioca", "Trigo BRS"],
  OUTRO: ["Diesel S10", "Pecas pulverizador", "Filtros hidraulicos"],
};
