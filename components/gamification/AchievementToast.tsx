"use client";

import { useEffect, useState } from "react";
import { PartyPopper, X } from "lucide-react";

/**
 * Fase 14 — aviso flutuante de conquista recém-desbloqueada. O `StudyHeartbeat`
 * (Fase 5) já faz o ping; aqui só ouvimos o evento `cogni:achievement` que
 * qualquer fetch pode disparar, e mostramos o pop-up.
 */
type Item = { id: string; name: string };

export function AchievementToast() {
  const [queue, setQueue] = useState<Item[]>([]);

  useEffect(() => {
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<Item[]>).detail;
      if (Array.isArray(detail) && detail.length) setQueue((q) => [...q, ...detail]);
    }
    window.addEventListener("cogni:achievement", onEvent);
    return () => window.removeEventListener("cogni:achievement", onEvent);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;
  const cur = queue[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-primary/40 bg-card p-4 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-secondary">
        <PartyPopper className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Conquista desbloqueada!</p>
        <p className="text-xs text-muted">{cur.name}</p>
      </div>
      <button
        type="button"
        onClick={() => setQueue((q) => q.slice(1))}
        className="ml-2 rounded p-1 text-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
