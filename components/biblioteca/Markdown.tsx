import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Props que o react-markdown passa a um renderer de elemento (v9 inclui `node`). */
type MdEl<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T] & {
  node?: unknown;
};

/**
 * Renderiza markdown (tabelas GFM e figuras) no estilo dos guias de estudo.
 * Tabelas rolam horizontalmente no mobile; imagens viram <figure> com legenda
 * (o `title` do markdown `![alt](src "legenda")`).
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-cogni prose-sm max-w-none prose-headings:scroll-mt-20 prose-table:my-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          table: ({ node, ...props }: MdEl<"table">) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table {...props} className="my-0" />
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          img: ({ node, src, alt, title }: MdEl<"img">) => (
            <figure className="my-5 overflow-hidden rounded-xl border border-border bg-[#0B1220]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={typeof src === "string" ? src : ""}
                alt={typeof alt === "string" ? alt : ""}
                loading="lazy"
                className="mx-auto block w-full max-w-full"
              />
              {typeof title === "string" && title.length > 0 ? (
                <figcaption className="border-t border-border px-4 py-2 text-center text-xs text-muted">
                  {title}
                </figcaption>
              ) : null}
            </figure>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
