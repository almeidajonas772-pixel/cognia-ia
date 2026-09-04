"use client";

import { useState, useTransition } from "react";
import { Brain } from "lucide-react";
import { clearMemory } from "@/lib/chat/actions";
import type { MemoryContext } from "@/lib/ai/prompts";

export function MemoryCard({ memory }: { memory: MemoryContext | null }) {
  const [cleared, setCleared] = useState(false);
  const [pending, start] = useTransition();

  const hasContent =
    memory &&
    (memory.subjects.length > 0 ||
      memory.difficulties.length > 0 ||
      memory.level ||
      memory.notes);

  if (cleared || !hasContent) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Brain className="h-4 w-4 text-secondary" />
          Memória do aluno
        </span>
        <p className="mt-1">
          Ainda vazia. Conforme você usa o chat, a IA passa a lembrar suas
          matérias, seu nível e suas dificuldades para adaptar as respostas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Brain className="h-4 w-4 text-secondary" />
        O que a IA lembra de você
      </span>
      <ul className="mt-2 space-y-1 text-xs text-muted">
        {memory!.level && <li>Nível estimado: {memory!.level}</li>}
        {memory!.learningStyle && (
          <li>Estilo de aprendizado: {memory!.learningStyle}</li>
        )}
        {memory!.subjects.length > 0 && (
          <li>Matérias: {memory!.subjects.join(", ")}</li>
        )}
        {memory!.difficulties.length > 0 && (
          <li>Dificuldades: {memory!.difficulties.join(", ")}</li>
        )}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await clearMemory();
            setCleared(true);
          })
        }
        className="mt-3 text-xs text-secondary hover:underline disabled:opacity-50"
      >
        Limpar memória
      </button>
    </div>
  );
}
