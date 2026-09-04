"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission } from "@/lib/comunidade/library-submit";
import type { AdminSubmission } from "@/lib/admin/queries";

/** Aprovação de resumos enviados (spec §5). */
export function SubmissionReview({ items }: { items: AdminSubmission[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return <p className="text-sm text-muted">Nenhum resumo na fila.</p>;
  }

  const act = (id: string, d: "aprovado" | "reprovado" | "ajustes") =>
    start(async () => {
      await reviewSubmission(id, d);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {items.map((s) => (
        <div key={s.id} className="rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="text-sm font-medium text-foreground">
                {s.title}
              </span>
              <span className="ml-2 text-xs text-muted">
                {s.suggested_subject || "sem matéria"} ·{" "}
                {new Date(s.created_at).toLocaleDateString("pt-BR")}
              </span>
            </span>
          </button>
          {open === s.id && (
            <div className="space-y-3 border-t border-border p-4">
              <p className="whitespace-pre-wrap text-sm text-muted">
                {s.content.slice(0, 1200)}
                {s.content.length > 1200 && "…"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => act(s.id, "aprovado")}
                  className="h-8 rounded-lg border border-emerald-500/40 px-3 text-xs text-emerald-400 hover:bg-white/5"
                >
                  Aprovar e publicar na Biblioteca
                </button>
                <button
                  type="button"
                  onClick={() => act(s.id, "ajustes")}
                  className="h-8 rounded-lg border border-border px-3 text-xs text-foreground hover:bg-white/5"
                >
                  Solicitar ajustes
                </button>
                <button
                  type="button"
                  onClick={() => act(s.id, "reprovado")}
                  className="h-8 rounded-lg border border-rose-500/40 px-3 text-xs text-rose-400 hover:bg-white/5"
                >
                  Reprovar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
