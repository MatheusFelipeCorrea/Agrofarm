import { CalendarIcon, ClockIcon, ExternalLinkIcon } from "../../../components/ui/icons.jsx";
import NoticiaCategoriaBadge from "./NoticiaCategoriaBadge.jsx";

const FALLBACK_IMG = "/tractor-working-green-field.jpg";

export default function NoticiaDestaqueCard({ noticia }) {
  if (!noticia) return null;

  const imagem = noticia.imagemUrl || FALLBACK_IMG;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-[21/9] min-h-[180px] w-full bg-gray-100 sm:min-h-[220px]">
        <img
          src={imagem}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
        <div className="absolute left-4 top-4">
          <span className="inline-flex rounded-full bg-[var(--agro-accent-lime)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0f3c1a] ring-1 ring-[#0f3c1a]/10">
            Destaque
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-3">
          <NoticiaCategoriaBadge categoria={noticia.categoria} />
        </div>
        <h2 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">{noticia.titulo}</h2>
        {noticia.descricao ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{noticia.descricao}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {noticia.dataFormatada ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {noticia.dataFormatada}
              </span>
            ) : null}
            {noticia.minutosLeitura ? (
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
                {noticia.minutosLeitura} min de leitura
              </span>
            ) : null}
            {noticia.fonte?.nome ? (
              <span className="text-gray-400">· {noticia.fonte.nome}</span>
            ) : null}
          </div>

          <a
            href={noticia.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--agro-brand)] px-4 text-sm font-semibold text-white transition-colors hover:opacity-95"
          >
            Ler mais
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
