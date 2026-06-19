import {
  buildArrendamentoPayload,
  emptyArrendamentoForm,
  mapArrendamentoFromFazenda,
  validateArrendamentoForm,
} from "../components/fazenda/FazendaArrendamentoFields.jsx";

export const TIPOS_FAZENDA = [
  { value: "PROPRIA", label: "Própria" },
  { value: "ARRENDADA_DE_TERCEIROS", label: "Arrendada" },
  { value: "ARRENDADA_PARA_TERCEIROS", label: "Arrendada para terceiros" },
];

export const SITUACAO_FAZENDA = [
  { value: "ativa", label: "Ativa" },
  { value: "inativa", label: "Inativa" },
];

export function emptyFazendaForm() {
  return {
    nome: "",
    localizacao: "",
    latitude: undefined,
    longitude: undefined,
    ativa: true,
    tipo: "PROPRIA",
    ...emptyArrendamentoForm(),
  };
}

export function mapFazendaToForm(fazenda) {
  if (!fazenda) return emptyFazendaForm();

  return {
    nome: fazenda.nome ?? "",
    localizacao: fazenda.localizacao ?? "",
    latitude: fazenda.latitude ?? undefined,
    longitude: fazenda.longitude ?? undefined,
    ativa: fazenda.ativa !== false,
    tipo: fazenda.tipo ?? "PROPRIA",
    ...(fazenda.tipo === "ARRENDADA_PARA_TERCEIROS"
      ? mapArrendamentoFromFazenda(fazenda)
      : emptyArrendamentoForm()),
  };
}

export function buildFazendaPayload(form) {
  return {
    nome: (form.nome ?? "").trim(),
    localizacao: (form.localizacao ?? "").trim() || undefined,
    tipo: form.tipo,
    ativa: form.ativa !== false,
    ...(form.latitude != null && form.longitude != null
      ? { latitude: form.latitude, longitude: form.longitude }
      : {}),
    ...(form.tipo === "ARRENDADA_PARA_TERCEIROS" ? buildArrendamentoPayload(form) : {}),
  };
}

export function validateFazendaForm(form) {
  if (!(form.nome ?? "").trim()) {
    return "Informe o nome da fazenda.";
  }
  if (form.tipo === "ARRENDADA_PARA_TERCEIROS") {
    return validateArrendamentoForm(form);
  }
  return null;
}
