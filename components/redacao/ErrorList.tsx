"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { PRIORITY_META, type EssayError } from "@/lib/redacao/types";
import { cn } from "@/lib/utils";

export function ErrorList({
  errors,
  recurring,
}: {
  errors: EssayError[];
  recurring: Record<string, number>;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const sorted = [...errors].sort(
    (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted">Nenhum erro pontual destacado.</p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((e, i) => {
        const meta = PRIORITY_META[e.priority];
        const times = recurring[e.signature] ?? 0;
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-border"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5"
            >
              <span title={meta.label}>{meta.dot}</span>
              <span className="min-w-0 flex-1">
                <span className="text-xs font-medium text-muted">
                  {e.category}
                </span>
                <span className="block truncate text-sm text-foreground">
                  {e.excerpt || e.explanation}
                </span>
              </span>
              {times > 1 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <History className="h-3 w-3" />
                  {times}×
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="space-y-2 border-t border-border px-3 py-3 text-sm">
                {times > 1 && (
                  <p className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                    Este erro já apareceu {times} vezes nas suas redações.
                  </p>
                )}
                <Field label="Explicação">{e.explanation}</Field>
                {e.rule && <Field label="Regra / critério">{e.rule}</Field>}
                {e.correction && (
                  <Field label="Versão corrigida">
                    <span className="text-emerald-400">{e.correction}</span>
                  </Field>
                )}
                {e.rewrite && (
                  <Field label="Sugestão de reescrita">{e.rewrite}</Field>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-foreground">{children}</p>
    </div>
  );
}
