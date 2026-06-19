import { ExternalLinkIcon } from "../../../components/ui/icons.jsx";

export default function NoticiasFontesLinks({ fontes = [] }) {
  if (!fontes.length) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-gray-900">Fontes</p>
      <ul className="space-y-1.5">
        {fontes.map((fonte) => (
          <li key={fonte.id}>
            <a
              href={fonte.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--agro-brand)] hover:underline"
            >
              {fonte.nome}
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
        Conteúdo agregado via RSS; ao ler, você será direcionado ao site de origem (ex.: Canal Rural).
      </p>
    </section>
  );
}
