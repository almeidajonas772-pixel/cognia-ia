"use client";

import { useState, useTransition } from "react";
import { Laptop, LogOut, Loader2 } from "lucide-react";
import { revokeSessionAction, revokeAllSessionsAction } from "@/lib/security/actions";

type Item = {
  id: string;
  device_label: string | null;
  user_agent: string | null;
  last_seen_at: string;
  created_at: string;
  current: boolean;
};

export function SessionList({ sessions }: { sessions: Item[] }) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Laptop className="h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="truncate text-foreground">
                  {s.device_label || "Dispositivo"}
                  {s.current && (
                    <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                      este dispositivo
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  Último acesso {new Date(s.last_seen_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            {!s.current && (
              <button
                type="button"
                disabled={pending && busyId === s.id}
                onClick={() => {
                  setBusyId(s.id);
                  start(async () => {
                    await revokeSessionAction(s.id);
                    setBusyId(null);
                  });
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-foreground disabled:opacity-60"
              >
                {pending && busyId === s.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Encerrar
              </button>
            )}
          </li>
        ))}
        {sessions.length === 0 && (
          <li className="rounded-lg border border-border p-3 text-sm text-muted">
            Nenhuma sessão registrada ainda.
          </li>
        )}
      </ul>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await revokeAllSessionsAction();
          })
        }
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/40 px-3 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        Sair de todos os dispositivos
      </button>
    </div>
  );
}
