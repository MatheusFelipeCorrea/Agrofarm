export const CATEGORIAS = [
  { value: "FERTILIZANTE", label: "Fertilizante" },
  { value: "DEFENSIVO", label: "Defensivo" },
  { value: "SEMENTE", label: "Semente" },
  { value: "OUTRO", label: "Outro" },
];

export const UNIDADES = ["kg", "L", "sac", "un"];

export function labelCategoria(value) {
  return CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}

