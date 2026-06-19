/** Espelha regras de api/src/shared/cultura/culturaStatus.js */

function normalizarNomeCultura(nome) {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function isCulturaCafe(nomeCultura) {
  const chave = normalizarNomeCultura(nomeCultura);
  return chave === "cafe" || chave.includes("cafe");
}

const STATUS_LABELS = {
  SECAGEM: "Secagem",
  COLHEITA: "Colheita",
  PLANTIO: "Plantio",
  ADUBACAO: "Adubação",
  PULVERIZACAO: "Pulverização",
};

const STATUS_GERAIS = ["PLANTIO", "COLHEITA", "ADUBACAO", "PULVERIZACAO"];

export function statusPermitidosParaCultura(nomeCultura) {
  const valores = isCulturaCafe(nomeCultura) ? ["SECAGEM", ...STATUS_GERAIS] : STATUS_GERAIS;
  return valores.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
}

export function statusPadraoParaCultura(nomeCultura) {
  return isCulturaCafe(nomeCultura) ? "SECAGEM" : "PLANTIO";
}

export function statusValidoParaCultura(nomeCultura, status) {
  return statusPermitidosParaCultura(nomeCultura).some((s) => s.value === status);
}

/** Soma area_hectares dos talhões (polígonos) da cultura na fazenda. */
export function somarHectaresTalhoes(poligonos, culturaId) {
  if (!culturaId || !Array.isArray(poligonos)) return 0;
  return poligonos
    .filter((p) => (p.cultura_id ?? p.cultura?.id) === culturaId)
    .reduce((sum, p) => sum + Number(p.area_hectares ?? 0), 0);
}

export function contarTalhoesPorCultura(poligonos, culturaId) {
  if (!culturaId || !Array.isArray(poligonos)) return 0;
  return poligonos.filter((p) => (p.cultura_id ?? p.cultura?.id) === culturaId).length;
}
