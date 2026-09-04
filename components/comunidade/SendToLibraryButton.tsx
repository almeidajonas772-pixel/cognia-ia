"use client";

import { useState } from "react";
import { BookUp, Loader2, Check } from "lucide-react";
import { submitSummaryToLibrary } from "@/lib/comunidade/library-submit";

/**
 * "Enviar para a Biblioteca" (spec §12). Usado no resultado de um resumo do Chat.
 */
export function SendToLibraryButton({
  content,
  defaultTitle,
  conversationId,
}: {
  content: string;
  defaultTitle?: string;
  conversationId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (title.trim().length < 4) {
      setErr("Dê um título ao resumo.");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await submitSummaryToLibrary({
      title,
      content,
      suggestedSubject: subject || undefined,
      conversationId,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(
        res.error === "resumo_curto"
          ? "O resumo está curto demais para enviar."
          : "Não foi possível enviar."
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Enviado para revisão da equipe COGNI IA.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted hover:text-foreground"
      >
        <BookUp className="h-3.5 w-3.5" />
        Enviar para a Biblioteca
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-muted">
        A equipe revisa antes de publicar. Informações pessoais são removidas.
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do resumo"
        className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Matéria sugerida (opcional)"
        className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none"
      />
      {err && <p className="text-xs text-rose-400">{err}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Enviar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 rounded-lg border border-border px-3 text-xs text-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
