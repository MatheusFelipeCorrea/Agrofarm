/** Imagem em web/public/Agro.jpg — servida na raiz pelo Vite */
const HERO_INSIGHTS_IMG = "/Agro.jpg";

export default function InsightGreetingCard({ nome, texto }) {  const primeiroNome = String(nome ?? "Administrador").trim().split(/\s+/)[0] || "Administrador";
  const mensagem =
    texto?.trim() ||
    `Olá, ${primeiroNome}! Tudo bem? Animado para ver os insights de hoje?`;

  return (
    <section
      className="relative min-h-[168px] overflow-hidden rounded-2xl border border-[var(--agro-card-border)] shadow-sm sm:min-h-[188px]"
      data-testid="insight-greeting"
    >
      <img
        src={HERO_INSIGHTS_IMG}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#073a2f]/92 via-[#073a2f]/55 to-[#073a2f]/25"
        aria-hidden
      />
      <div className="relative flex min-h-[168px] items-center px-6 py-8 sm:min-h-[188px] sm:px-10 sm:py-10">
        <p className="max-w-3xl text-lg font-medium leading-snug text-white sm:text-xl md:text-[1.35rem]">
          {mensagem.startsWith("Olá") ? mensagem : `Olá, ${primeiroNome}! Tudo bem? ${mensagem}`}
        </p>
      </div>
    </section>
  );
}
