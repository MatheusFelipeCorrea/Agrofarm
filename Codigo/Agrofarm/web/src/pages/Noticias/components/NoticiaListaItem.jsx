import { CalendarIcon, ClockIcon, ExternalLinkIcon } from "../../../components/ui/icons.jsx";
import NoticiaCategoriaBadge from "./NoticiaCategoriaBadge.jsx";

const FALLBACK_IMG = "/Agro.jpg";

export default function NoticiaListaItem({ noticia }) {
  const imagem = noticia.imagemUrl || FALLBACK_IMG;

  return (
    <article className="flex gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <a
        href={noticia.link}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-32"
        aria-label={`Abrir: ${noticia.titulo}`}
      >
        <img
          src={imagem}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
      </a>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <NoticiaCategoriaBadge categoria={noticia.categoria} className="text-[10px]" />
          {noticia.fonte?.nome ? (
            <span className="text-[10px] font-medium text-gray-400">{noticia.fonte.nome}</span>
          ) : null}
        </div>

        <a
          href={noticia.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold leading-snug text-gray-900 hover:text-[var(--agro-brand)] sm:text-base"
        >
          {noticia.titulo}
        </a>

        {noticia.descricao ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{noticia.descricao}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            {noticia.dataFormatada ? (
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {noticia.dataFormatada}
              </span>
            ) : null}
            {noticia.minutosLeitura ? (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {noticia.minutosLeitura} min
              </span>
            ) : null}
          </div>

          <a
            href={noticia.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--agro-brand)] hover:underline"
          >
            Abrir
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
