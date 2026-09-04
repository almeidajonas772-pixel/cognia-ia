"use client";

import { useState, useTransition } from "react";
import { Check, Star, Download, Loader2 } from "lucide-react";
import {
  setContentCompleted,
  setContentFavorite,
} from "@/lib/biblioteca/actions";
import { cn } from "@/lib/utils";

export function ContentActions({
  contentId,
  subjectSlug,
  contentSlug,
  title,
  initialCompleted,
  initialFavorite,
  canDownload,
}: {
  contentId: string;
  subjectSlug: string;
  contentSlug: string;
  title: string;
  initialCompleted: boolean;
  initialFavorite: boolean;
  canDownload: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, start] = useTransition();

  function toggleCompleted() {
    const next = !completed;
    setCompleted(next);
    start(async () => {
      const res = await setContentCompleted({
        subjectSlug,
        contentSlug,
        completed: next,
        contentId,
        title,
      });
      if (!res?.ok) setCompleted(!next);
    });
  }

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    start(async () => {
      const res = await setContentFavorite({
        contentId,
        subjectSlug,
        contentSlug,
        favorite: next,
      });
      if (!res?.ok) setFavorite(!next);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleCompleted}
        disabled={pending}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-60",
          completed
            ? "border-primary bg-primary text-white"
            : "border-border text-foreground hover:bg-white/5"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {completed ? "Concluído" : "Marcar como concluído"}
      </button>

      <button
        type="button"
        onClick={toggleFavorite}
        disabled={pending}
        aria-pressed={favorite}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-60",
          favorite ? "text-amber-400" : "text-foreground"
        )}
      >
        <Star className={cn("h-4 w-4", favorite && "fill-amber-400")} />
        {favorite ? "Favoritado" : "Favoritar"}
      </button>

      {canDownload && (
        <a
          href={`/biblioteca/${subjectSlug}/${contentSlug}/download`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
        >
          <Download className="h-4 w-4" />
          Baixar (.doc)
        </a>
      )}
    </div>
  );
}
