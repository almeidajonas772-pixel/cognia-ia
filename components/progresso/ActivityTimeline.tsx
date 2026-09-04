import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  MessageSquareText,
  ClipboardList,
  PenLine,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ActivityItem, ActivityKind } from "@/lib/progresso/types";

const ICON: Record<ActivityKind, LucideIcon> = {
  content_read: BookOpen,
  content_completed: CheckCircle2,
  chat: MessageSquareText,
  questions: ClipboardList,
  essay: PenLine,
  community: Users,
};

const VERB: Record<ActivityKind, string> = {
  content_read: "Abriu",
  content_completed: "Concluiu",
  chat: "Conversou —",
  questions: "Gerou questões —",
  essay: "Enviou redação —",
  community: "Publicou —",
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yst = new Date(Date.now() - 86_400_000);
  const k = (x: Date) => x.toISOString().slice(0, 10);
  if (k(d) === k(today)) return "Hoje";
  if (k(d) === k(yst)) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

export function ActivityTimeline({
  items,
}: {
  items: (ActivityItem & { href: string })[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nada por aqui ainda. Suas leituras, conversas e exercícios aparecem
        nesta linha do tempo automaticamente.
      </p>
    );
  }

  const groups: { label: string; items: typeof items }[] = [];
  for (const it of items) {
    const label = dayLabel(it.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {g.label}
          </p>
          <div className="space-y-1">
            {g.items.map((it) => {
              const Icon = ICON[it.kind];
              const time = new Date(it.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-muted">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {VERB[it.kind]} {it.ref_label ?? ""}
                  </span>
                  {it.subject_slug && (
                    <span className="hidden shrink-0 text-xs text-muted sm:inline">
                      {it.subject_slug}
                    </span>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {time}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
