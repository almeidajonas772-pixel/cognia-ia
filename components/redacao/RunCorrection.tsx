"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";

const STEPS = [
  "Lendo a redação…",
  "Aplicando os critérios da banca…",
  "Avaliando cada competência…",
  "Levantando erros e sugestões…",
  "Montando o relatório…",
];

/**
 * Fase 10 — dispara a correção (que agora é enfileirada) e faz polling do
 * endpoint de status até concluir. Botão de repetir em caso de falha.
 */
export function RunCorrection({ essayId, auto }: { essayId: string; auto: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const poll = useCallback(
    async (attempt: number) => {
      try {
        const res = await fetch(`/api/redacao/${essayId}/status`, { cache: "no-store" });
        const data = (await res.json()) as {
          progress?: number;
          done?: boolean;
          failed?: boolean;
        };
        setProgress(Math.max(data.progress ?? 0, Math.min(90, attempt * 8)));

        if (data.failed) {
          setError("Não foi possível corrigir agora.");
          setRunning(false);
          return;
        }
        if (data.done) {
          setProgress(100);
          router.refresh();
          return;
        }
      } catch {
        /* rede instável — continua tentando */
      }
      if (attempt > 40) {
        setError("A correção está demorando mais que o normal. Tente novamente.");
        setRunning(false);
        return;
      }
      timer.current = setTimeout(() => poll(attempt + 1), 2500);
    },
    [essayId, router]
  );

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setProgress(5);
    try {
      const res = await fetch(`/api/redacao/${essayId}/corrigir`, { method: "POST" });
      if (!res.ok && res.status !== 200) throw new Error(String(res.status));
    } catch {
      setError("Não foi possível iniciar a correção.");
      setRunning(false);
      return;
    }
    poll(1);
  }, [essayId, poll]);

  useEffect(() => {
    if (auto && !started.current) {
      started.current = true;
      run();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  if (running) {
    const stepIdx = Math.min(Math.floor(progress / 20), STEPS.length - 1);
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          <div>
            <p className="text-sm font-medium text-foreground">Corrigindo sua redação</p>
            <p className="text-xs text-muted">{STEPS[stepIdx]}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {error ? (
        <p className="mb-3 text-sm text-rose-400">{error}</p>
      ) : (
        <p className="mb-3 text-sm text-muted">A redação está pronta para correção.</p>
      )}
      <button
        type="button"
        onClick={run}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {error ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {error ? "Tentar de novo" : "Corrigir agora"}
      </button>
    </div>
  );
}
