import kinks from "@turf/kinks";

export function validarPoligono(geojson) {
  if (!geojson || !geojson.geometry) {
    return { valido: false, erro: "Geometria inválida" };
  }

  if (geojson.geometry.type !== "Polygon") {
    return { valido: false, erro: "Geometria deve ser do tipo Polygon" };
  }

  const coords = geojson.geometry.coordinates[0];
  if (!coords || coords.length < 4) {
    return { valido: false, erro: "Polígono precisa de no mínimo 3 vértices" };
  }

  const primeiro = coords[0];
  const ultimo = coords[coords.length - 1];
  if (primeiro[0] !== ultimo[0] || primeiro[1] !== ultimo[1]) {
    return { valido: false, erro: "Polígono não está fechado" };
  }

  for (const coord of coords) {
    const [lng, lat] = coord;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { valido: false, erro: "Coordenadas fora dos limites válidos" };
    }
  }

  try {
    const autoIntersecoes = kinks(geojson);
    if (autoIntersecoes.features.length > 0) {
      return {
        valido: false,
        erro: "Polígono inválido: as linhas não podem se cruzar",
        pontos: autoIntersecoes.features.map((f) => f.geometry.coordinates),
      };
    }
  } catch {
    // se kinks lançar, continua
  }

  return { valido: true };
}

export function validarNomeArea(nome) {
  const nomeTrimmed = (nome ?? "").trim();
  if (nomeTrimmed.length === 0) {
    return { valido: false, erro: "Nome da área é obrigatório" };
  }
  if (nomeTrimmed.length > 100) {
    return { valido: false, erro: "Nome da área deve ter no máximo 100 caracteres" };
  }
  return { valido: true };
}

/** Nome do talhão: obrigatório se não houver cultura plantada selecionada. */
export function validarNomeTalhao(nome, culturaId) {
  const nomeTrimmed = (nome ?? "").trim();
  if (nomeTrimmed.length > 0) {
    return validarNomeArea(nome);
  }
  if (culturaId) {
    return { valido: true };
  }
  return {
    valido: false,
    erro: "Informe o nome do talhão ou selecione a cultura plantada",
  };
}

export function validarDataPlantio(data) {
  if (!data) return { valido: true };
  const dataPlantio = new Date(data);
  if (isNaN(dataPlantio.getTime())) {
    return { valido: false, erro: "Data de plantio inválida" };
  }
  return { valido: true };
}

/** Data de plantio é obrigatória ao criar/editar um talhão. */
export function validarDataPlantioObrigatoria(data) {
  if (!data) {
    return { valido: false, erro: "A data de plantio é obrigatória" };
  }
  return validarDataPlantio(data);
}

/**
 * Data de colheita é obrigatória e deve ser igual ou posterior à data de plantio.
 * Pode ser no passado, presente ou futuro.
 */
export function validarDataColheita(dataColheita, dataPlantio) {
  if (!dataColheita) {
    return { valido: false, erro: "A data de colheita é obrigatória" };
  }
  const colheita = new Date(dataColheita);
  if (isNaN(colheita.getTime())) {
    return { valido: false, erro: "Data de colheita inválida" };
  }
  if (dataPlantio) {
    const plantio = new Date(dataPlantio);
    if (!isNaN(plantio.getTime()) && colheita < plantio) {
      return {
        valido: false,
        erro: "A data de colheita deve ser igual ou posterior à data de plantio",
      };
    }
  }
  return { valido: true };
}
