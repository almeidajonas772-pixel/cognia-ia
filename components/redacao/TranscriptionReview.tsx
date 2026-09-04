"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Loader2 } from "lucide-react";
import {
  confirmTranscription,
  updateTranscription,
} from "@/lib/redacao/actions";

/** "Confira a transcrição da sua redação" (spec §1.2). */
export function TranscriptionReview({
  essayId,
  initialText,
}: {
  essayId: string;
  initialText: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await updateTranscription(essayId, text);
      setEditing(false);
      router.refresh();
    });
  }

  function confirm() {
    start(async () => {
      if (editing) await updateTranscription(essayId, text);
      await confirmTranscription(essayId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-medium text-amber-300">
          Confira a transcrição da sua redação
        </p>
        <p className="mt-1 text-xs text-muted">
          O texto abaixo foi extraído por OCR. A correção só começa depois que
          você confirmar.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setEditing(true);
        }}
        rows={16}
        className="w-full resize-y rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground focus:border-primary/50 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={pending || text.trim().length < 40}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Confirmar transcrição
        </button>
        {editing && (
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" />
            Salvar edição
          </button>
        )}
      </div>
    </div>
  );
}
