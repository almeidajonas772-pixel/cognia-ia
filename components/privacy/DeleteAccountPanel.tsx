"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { requestDeletionAction } from "@/lib/privacy/actions";

export function DeleteAccountPanel({ graceDays }: { graceDays: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">
        A exclusão é definitiva. Após confirmar, sua conta fica agendada para
        remoção em {graceDays} dias — nesse período você pode cancelar. Depois
        disso, todos os dados são apagados sem possibilidade de recuperação.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/40 px-3 text-rose-300 hover:bg-rose-500/10"
        >
          <AlertTriangle className="h-4 w-4" />
          Excluir minha conta
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-rose-500/40 p-3">
          <p className="text-foreground">
            Digite <strong>EXCLUIR</strong> para confirmar:
          </p>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-9 w-40 rounded-lg border border-border bg-background px-3 text-foreground"
          />
          {err && <p className="text-rose-400">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || confirm.trim().toUpperCase() !== "EXCLUIR"}
              onClick={() =>
                start(async () => {
                  const res = await requestDeletionAction();
                  if (res.ok) router.refresh();
                  else setErr("Não foi possível agendar a exclusão.");
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 font-medium text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar exclusão
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
