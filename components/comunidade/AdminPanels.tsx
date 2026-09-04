"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trash2, Loader2 } from "lucide-react";
import {
  adminModeratePost,
  adminResolveReport,
} from "@/lib/comunidade/admin";
import { reviewSubmission } from "@/lib/comunidade/library-submit";

type PendingPost = {
  id: string;
  title: string;
  content: string;
  moderation_note: string | null;
};
type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail: string | null;
  created_at: string;
};
type Submission = {
  id: string;
  title: string;
  content: string;
  suggested_subject: string | null;
  created_at: string;
};

export function AdminPanels({
  pendingPosts,
  reports,
  submissions,
}: {
  pendingPosts: PendingPost[];
  reports: Report[];
  submissions: Submission[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="space-y-8">
      <Section title={`Publicações em revisão (${pendingPosts.length})`}>
        {pendingPosts.length === 0 ? (
          <Empty>Nada pendente.</Empty>
        ) : (
          pendingPosts.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{p.content}</p>
              {p.moderation_note && (
                <p className="mt-1 text-xs text-amber-400">
                  Motivo: {p.moderation_note}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <Btn
                  onClick={() => run(() => adminModeratePost(p.id, "aprovar"))}
                  tone="ok"
                >
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </Btn>
                <Btn
                  onClick={() => run(() => adminModeratePost(p.id, "remover"))}
                  tone="danger"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </Btn>
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title={`Denúncias abertas (${reports.length})`}>
        {reports.length === 0 ? (
          <Empty>Nenhuma denúncia aberta.</Empty>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <p className="text-sm text-foreground">
                {r.target_type} · <span className="text-amber-400">{r.reason}</span>
              </p>
              {r.detail && <p className="mt-1 text-xs text-muted">{r.detail}</p>}
              <p className="mt-1 text-xs text-muted">
                alvo: <code>{r.target_id.slice(0, 8)}</code>
              </p>
              <div className="mt-2 flex gap-2">
                <Link
                  href={
                    r.target_type === "post"
                      ? `/comunidade/p/${r.target_id}`
                      : "#"
                  }
                  className="inline-flex h-7 items-center rounded-lg border border-border px-3 text-xs text-foreground hover:bg-white/5"
                >
                  Ver
                </Link>
                <Btn
                  onClick={() => run(() => adminResolveReport(r.id))}
                  tone="ok"
                >
                  <Check className="h-3.5 w-3.5" /> Resolver
                </Btn>
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title={`Resumos para a Biblioteca (${submissions.length})`}>
        {submissions.length === 0 ? (
          <Empty>Nenhum resumo na fila.</Empty>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              {s.suggested_subject && (
                <p className="text-xs text-muted">
                  Matéria sugerida: {s.suggested_subject}
                </p>
              )}
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted">
                {s.content}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Btn
                  onClick={() =>
                    run(() => reviewSubmission(s.id, "aprovado"))
                  }
                  tone="ok"
                >
                  Aprovar e publicar
                </Btn>
                <Btn
                  onClick={() => run(() => reviewSubmission(s.id, "ajustes"))}
                  tone="neutral"
                >
                  Pedir ajustes
                </Btn>
                <Btn
                  onClick={() => run(() => reviewSubmission(s.id, "reprovado"))}
                  tone="danger"
                >
                  Reprovar
                </Btn>
              </div>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
function Btn({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone: "ok" | "danger" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/40 text-emerald-400"
      : tone === "danger"
        ? "border-rose-500/40 text-rose-400"
        : "border-border text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1 rounded-lg border px-3 text-xs hover:bg-white/5 ${cls}`}
    >
      {children}
    </button>
  );
}
