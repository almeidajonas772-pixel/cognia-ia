"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { requestExportAction } from "@/lib/privacy/actions";

type ExportRow = {
  id: string;
  status: string;
  requested_at: string;
  expires_at: string | null;
};

const LABEL: Record<string, string> = {
  pending: "Na fila",
  processing: "Processando",
  ready: "Pronta",
  error: "Falhou",
  expired: "Expirada",
};

export function DataExportPanel({ exports }: { exports: ExportRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const latest = exports[0];
  const inProgress = latest && (latest.status === "pending" || latest.status === "processing");

  useEffect(() => {
    if (!inProgress) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [inProgress, router]);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">
        Você pode baixar uma cópia de todos os seus dados (perfil, progresso,
        conversas, redações, atividade). O arquivo fica disponível por 7 dias.
      </p>

      <button
        type="button"
        disabled={pending || inProgress}
        onClick={() =>
          start(async () => {
            const res = await requestExportAction();
            if (!res.ok)
              setErr(
                res.error === "already_running"
                  ? "Já existe uma exportação em andamento."
                  : "Não foi possível solicitar agora."
              );
            else router.refresh();
          })
        }
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {(pending || inProgress) && <Loader2 className="h-4 w-4 animate-spin" />}
        {inProgress ? "Preparando sua exportação…" : "Solicitar exportação"}
      </button>
      {err && <p className="text-rose-400">{err}</p>}

      {exports.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {exports.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
            >
              <span className="text-muted">
                {new Date(e.requested_at).toLocaleString("pt-BR")} ·{" "}
                <span className="text-foreground">{LABEL[e.status] ?? e.status}</span>
              </span>
              {e.status === "ready" && (
                <a
                  href={`/api/privacy/export/${e.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-secondary hover:bg-white/5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
