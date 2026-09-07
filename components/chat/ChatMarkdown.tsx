"use client";

import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type TableEl = ComponentProps<"table"> & { node?: unknown };

/** Markdown das respostas do chat (mesmo estilo prose da biblioteca). */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-cogni prose-sm max-w-none prose-pre:bg-background prose-table:my-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          table: ({ node, ...props }: TableEl) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table {...props} className="my-0" />
            </div>
          ),
        } as Components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
