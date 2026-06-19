/** Rodapé de contexto (mesmo padrão visual das mensagens do chatbot). */
export default function InsightFazendaRodape({ nome, prefixo = "Fazenda" }) {
  if (!nome?.trim()) return null;

  return (
    <p className="mt-2 border-t border-gray-100 pt-2 text-[10px] leading-snug">
      <span className="text-gray-500">{prefixo}: </span>
      <span className="font-semibold text-emerald-700" title={nome}>
        {nome}
      </span>
    </p>
  );
}
