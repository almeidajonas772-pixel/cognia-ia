"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { reportContent } from "@/lib/comunidade/actions";
import {
  REPORT_REASON_LABEL,
  type ReportReason,
  type ReportTarget,
} from "@/lib/comunidade/types";

export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTarget;
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await reportContent({ targetType, targetId, reason, detail });
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
        {sent ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Denúncia enviada
            </p>
            <p className="text-sm text-muted">
              A equipe vai analisar. Obrigado por ajudar a manter a comunidade
              saudável.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-full rounded-lg border border-border text-sm text-foreground hover:bg-white/5"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">
              Denunciar {targetType === "comment" ? "comentário" : "publicação"}
            </p>
            <div className="mt-3 space-y-1">
              {(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {REPORT_REASON_LABEL[r]}
                </label>
              ))}
            </div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              placeholder="Detalhe (opcional)"
              className="mt-3 w-full resize-none rounded-lg border border-border bg-surface p-2 text-xs text-foreground placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="mt-3 h-9 w-full rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              Enviar denúncia
            </button>
          </>
        )}
      </div>
    </div>
  );
}
