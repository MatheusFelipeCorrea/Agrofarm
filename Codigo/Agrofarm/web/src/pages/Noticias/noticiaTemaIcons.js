import {
  BriefcaseIcon,
  CloudSunIcon,
  CpuIcon,
  FileTextIcon,
  GlobeIcon,
  SproutIcon,
} from "../../components/ui/icons.jsx";

export const TEMA_ICONE_MAP = {
  CLIMA: CloudSunIcon,
  MERCADO: BriefcaseIcon,
  MANEJO: SproutIcon,
  TECNOLOGIA: CpuIcon,
  POLITICAS: FileTextIcon,
  SUSTENTABILIDADE: GlobeIcon,
};

export function getTemaIcon(categoriaId) {
  return TEMA_ICONE_MAP[categoriaId] ?? BriefcaseIcon;
}
