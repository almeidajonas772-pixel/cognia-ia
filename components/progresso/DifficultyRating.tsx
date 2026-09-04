"use client";

import { useState, useTransition } from "react";
import { rateDifficulty } from "@/lib/progresso/actions";
import type { DifficultyLevel } from "@/lib/progresso/types";
import { cn } from "@/lib/utils";

const OPTIONS: { level: DifficultyLevel; label: string; tone: string }[] = [
  { level: "facil", label: "Fácil", tone: "text-emerald-400 border-emerald-500/40" },
  { level: "medio", label: "Médio", tone: "text-amber-400 border-amber-500/40" },
  { level: "dificil", label: "Difícil", tone: "text-rose-400 border-rose-500/40" },
];

export function DifficultyRating({
  contentId,
  subjectSlug,
  contentSlug,
  initial,
}: {
  contentId: string;
  subjectSlug: string;
  contentSlug: string;
  initial: DifficultyLevel | null;
}) {
  const [current, setCurrent] = useState<DifficultyLevel | null>(initial);
  const [pending, start] = useTransition();

  function choose(level: DifficultyLevel) {
    const prev = current;
    setCurrent(level);
    start(async () => {
      const res = await rateDifficulty({
        contentId,
        level,
        subjectSlug,
        contentSlug,
      });
      if (!res?.ok) setCurrent(prev);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Como foi este conteúdo para você?
      </p>
      <p className="mt-1 text-xs text-muted">
        Ajuda o COGNI IA a estimar seu domínio e sugerir revisões.
      </p>
      <div className="mt-3 flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.level}
            type="button"
            disabled={pending}
            onClick={() => choose(o.level)}
            className={cn(
              "h-9 flex-1 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60",
              current === o.level
                ? o.tone + " bg-white/5"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
