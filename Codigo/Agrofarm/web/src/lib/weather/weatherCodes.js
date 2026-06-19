export function weatherCodeLabel(code) {
  const c = Number(code);
  const map = {
    0: "Céu limpo",
    1: "Principalmente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nebulosidade",
    48: "Nevoeiro",
    51: "Garoa leve",
    61: "Chuva leve",
    80: "Pancadas de chuva",
    95: "Trovoadas",
  };
  return map[c] ?? "Condições variáveis";
}
