"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ListChecks, Sparkles } from "lucide-react";
import { Composer, type PendingImage } from "@/components/chat/Composer";
import { ModeDepth } from "@/components/chat/ModeDepth";
import { GenerateDialog } from "@/components/chat/GenerateDialog";
import { createConversation } from "@/lib/chat/actions";
import type { ChatDepth, ChatMode } from "@/lib/chat/types";

const SUGGESTIONS = [
  "Explique a função da mitocôndria com uma analogia",
  "Resolva passo a passo: 2x² − 8x + 6 = 0",
  "Resuma a Revolução Francesa para revisão de ENEM",
  "Quais são os tipos de intertextualidade? Dê exemplos",
];

const pendingKey = (id: string) => `cogni:chat:pending:${id}`;

export function NewChat() {
  const router = useRouter();
  const [mode, setMode] = useState<ChatMode>("professor");
  const [depth, setDepth] = useState<ChatDepth>("intermediario");
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState<null | "resumo" | "questoes">(null);

  async function startConversation(message: string, images: PendingImage[]) {
    if (busy) return;
    setBusy(true);
    const res = await createConversation({ mode, depth });
    if (!res.ok) {
      setBusy(false);
      return;
    }
    try {
      sessionStorage.setItem(
        pendingKey(res.id),
        JSON.stringify({ message, images })
      );
    } catch {
      /* ignore */
    }
    router.push(`/chat/${res.id}`);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-secondary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-xl font-semibold text-foreground">
          Como posso ajudar nos estudos?
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tire dúvidas, gere resumos e questões, ou envie a foto de um exercício.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ModeDepth mode={mode} depth={depth} onMode={setMode} onDepth={setDepth} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTool("resumo")}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs text-muted hover:text-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setTool("questoes")}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs text-muted hover:text-foreground"
          >
            <ListChecks className="h-3.5 w-3.5" />
            Questões
          </button>
        </div>
      </div>

      <Composer
        onSend={startConversation}
        streaming={busy}
        autoFocus
        placeholder="Pergunte qualquer coisa sobre suas matérias..."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => startConversation(s, [])}
            disabled={busy}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {tool && (
        <GenerateDialog
          kind={tool}
          defaultDepth={depth}
          onClose={() => setTool(null)}
        />
      )}
    </div>
  );
}
