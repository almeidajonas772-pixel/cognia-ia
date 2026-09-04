import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { getTimeline, getProgressCore } from "@/lib/progresso/queries";
import { progressLimits } from "@/lib/progresso/limits";
import { ActivityTimeline } from "@/components/progresso/ActivityTimeline";
import { ACTIVITY_LABEL, type ActivityKind } from "@/lib/progresso/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Histórico" };

const KINDS: ActivityKind[] = [
  "content_read",
  "content_completed",
  "chat",
  "questions",
];

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: { subject?: string; kind?: string };
}) {
  const user = await requireUser();
  const profile = await getProfile();
  const lim = progressLimits(profile);

  const [items, core] = await Promise.all([
    getTimeline(user.id, {
      days: lim.historyDays,
      items: lim.historyItems,
      subject: searchParams.subject,
      kind: searchParams.kind as ActivityKind | undefined,
    }),
    getProgressCore(user.id),
  ]);

  const subjects = core.subjects;
  const mk = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const subject = patch.subject ?? searchParams.subject;
    const kind = patch.kind ?? searchParams.kind;
    if (subject) p.set("subject", subject);
    if (kind) p.set("kind", kind);
    const qs = p.toString();
    return qs ? `/historico?${qs}` : "/historico";
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Histórico de estudos
          </h1>
          <p className="mt-1 text-sm text-muted">
            Registrado automaticamente
            {lim.historyDays < 365 && ` · últimos ${lim.historyDays} dias no plano gratuito`}
            .
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterChip href={mk({ kind: undefined })} active={!searchParams.kind}>
            Tudo
          </FilterChip>
          {KINDS.map((k) => (
            <FilterChip
              key={k}
              href={mk({ kind: k })}
              active={searchParams.kind === k}
            >
              {ACTIVITY_LABEL[k]}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            href={mk({ subject: undefined })}
            active={!searchParams.subject}
          >
            Todas as matérias
          </FilterChip>
          {subjects.map((s) => (
            <FilterChip
              key={s.slug}
              href={mk({ subject: s.slug })}
              active={searchParams.subject === s.slug}
            >
              {s.name}
            </FilterChip>
          ))}
        </div>
      </div>

      <ActivityTimeline items={items} />

      {lim.historyDays < 365 && (
        <p className="text-center text-xs text-muted">
          O histórico completo é um recurso{" "}
          <Link href="/perfil" className="text-secondary hover:underline">
            Premium
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-secondary"
          : "border-border text-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
