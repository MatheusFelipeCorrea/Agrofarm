import { FAZENDA_TODAS_VALUE } from "../../../store/slices/fazendaSlice.js";

export function buildFazendaOptions(fazendas = []) {
  const dinamicas = Array.isArray(fazendas)
    ? fazendas
        .filter((f) => f && typeof f.id === "string" && typeof f.nome === "string")
        .map((f) => ({ id: f.id, nome: f.nome }))
    : [];

  return [{ id: FAZENDA_TODAS_VALUE, nome: "Todas as Fazendas" }, ...dinamicas];
}

export function getFazendaSelecionadaLabel(options, fazendaSelecionada) {
  const encontrada = options.find((opcao) => opcao.id === fazendaSelecionada);
  return encontrada?.nome ?? "Todas as Fazendas";
}
