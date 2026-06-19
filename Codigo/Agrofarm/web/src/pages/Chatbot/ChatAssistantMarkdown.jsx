import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <p className="mb-2 text-base font-bold text-slate-900">{children}</p>,
  h2: ({ children }) => <p className="mb-2 text-sm font-bold text-slate-900">{children}</p>,
  h3: ({ children }) => <p className="mb-1.5 text-sm font-semibold text-slate-900">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-[#22c55e]/50 pl-3 text-slate-600 last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800">
          {children}
        </code>
      );
    }
    return (
      <code className="block overflow-x-auto rounded-lg bg-slate-100 p-2 font-mono text-xs text-slate-800">
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
      className="font-medium text-[#0f7f3b] underline underline-offset-2 hover:text-[#0d6d33]"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="min-w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-slate-200 bg-slate-50">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1.5 font-semibold text-slate-800">{children}</th>,
  td: ({ children }) => <td className="border-t border-slate-100 px-2 py-1.5 text-slate-700">{children}</td>,
};

export default function ChatAssistantMarkdown({ content }) {
  if (!content?.trim()) return null;

  return (
    <div className="chat-markdown text-sm leading-relaxed text-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
