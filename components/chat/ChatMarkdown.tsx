"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MdEl<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T] & {
  node?: unknown;
};

/** Markdown das respostas do chat (mesmo estilo prose da biblioteca). */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-cogni prose-sm max-w-none prose-pre:bg-background prose-table:my-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          table: ({ node, ...props }: MdEl<"table">) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table {...props} className="my-0" />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
