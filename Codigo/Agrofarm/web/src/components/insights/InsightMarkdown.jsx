import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { destacarAcoesMarkdown } from "../../utils/insightTextHighlight.js";

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-emerald-700">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <p className="mb-2 text-sm font-bold text-gray-900">{children}</p>,
  h2: ({ children }) => <p className="mb-2 text-sm font-bold text-gray-900">{children}</p>,
  h3: ({ children }) => <p className="mb-1.5 text-xs font-semibold text-gray-900">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-emerald-500/40 pl-3 text-gray-600 last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-800">
          {children}
        </code>
      );
    }
    return (
      <code className="block overflow-x-auto rounded-lg bg-gray-100 p-2 font-mono text-xs text-gray-800">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto last:mb-0">{children}</pre>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#2e5b47] underline underline-offset-2 hover:text-[#1a4d3c]"
    >
      {children}
    </a>
  ),
};

export default function InsightMarkdown({ content, destacarAcoes = true, className = "" }) {
  if (!content?.trim()) return null;

  const processado = destacarAcoes ? destacarAcoesMarkdown(content) : content;

  return (
    <div className={`insight-markdown text-xs leading-relaxed text-gray-600 ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {processado}
      </ReactMarkdown>
    </div>
  );
}
