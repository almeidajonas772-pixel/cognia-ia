import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  RefreshCw,
  MessageSquareText,
  ClipboardList,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { RecurrenceBadge } from "@/components/biblioteca/RecurrenceBadge";
import type { Recurrence } from "@/lib/biblioteca/types";
import type { Recommendation, SubjectMastery } from "@/lib/progresso/types";
import type { WeakSpots } from "@/lib/progresso/queries";

export function StatCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-secondary">
          <Icon className="h-4 w-4" />
          <span className="text-xs text-muted">{label}</span>
        </div>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export function SubjectMasteryList({
  subjects,
}: {
  subjects: SubjectMastery[];
}) {
  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted">
        Estude conteúdos da biblioteca para ver seu domínio por matéria.
      </p>
    );
  }
  const sorted = [...subjects].sort((a, b) => b.mastery - a.mastery);

  return (
    <div className="space-y-3">
      {sorted.map((s) => (
        <Link
          key={s.slug}
          href={`/biblioteca/${s.slug}`}
          className="block rounded-lg p-2 hover:bg-white/5"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{s.name}</span>
            <span className="text-muted">
              {s.done}/{s.total} · domínio {s.mastery}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${s.mastery}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

const REC_ICON: Record<Recommendation["kind"], LucideIcon> = {
  estudar: BookOpen,
  revisar: RefreshCw,
  praticar: MessageSquareText,
  simulado: ClipboardList,
};
const REC_TAG: Record<Recommendation["kind"], string> = {
  estudar: "Estudar",
  revisar: "Revisar",
  praticar: "Praticar",
  simulado: "Simulado",
};

export function RecommendationsCard({
  recs,
}: {
  recs: Recommendation[];
}) {
  if (recs.length === 0) {
    return (
      <p className="text-sm text-muted">
        Comece a estudar para receber recomendações.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {recs.map((r) => {
        const Icon = REC_ICON[r.kind];
        return (
          <Link
            key={r.id}
            href={r.href}
            className="group flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/40"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-secondary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  {REC_TAG[r.kind]}
                </span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {r.title}
              </p>
              <p className="text-xs text-muted">{r.reason}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}

export function WeakSpotsCard({ weak }: { weak: WeakSpots }) {
  const empty =
    weak.weakSubjects.length === 0 &&
    weak.staleContents.length === 0 &&
    weak.hardContents.length === 0 &&
    weak.untouchedSubjects.length === 0;

  if (empty) {
    return (
      <p className="text-sm text-muted">
        Nada sinalizado ainda. Conforme você estuda e avalia a dificuldade dos
        conteúdos, os pontos fracos aparecem aqui.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {weak.weakSubjects.length > 0 && (
        <Block title="Matérias com menor domínio">
          {weak.weakSubjects.map((s) => (
            <Link
              key={s.slug}
              href={`/biblioteca/${s.slug}`}
              className="flex justify-between rounded px-2 py-1 hover:bg-white/5"
            >
              <span className="text-foreground">{s.name}</span>
              <span className="text-muted">{s.mastery}%</span>
            </Link>
          ))}
        </Block>
      )}
      {weak.staleContents.length > 0 && (
        <Block title="Concluídos sem revisão recente">
          {weak.staleContents.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block truncate rounded px-2 py-1 text-foreground hover:bg-white/5"
            >
              {c.title}
            </Link>
          ))}
        </Block>
      )}
      {weak.hardContents.length > 0 && (
        <Block title="Marcados como difíceis">
          {weak.hardContents.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block truncate rounded px-2 py-1 text-foreground hover:bg-white/5"
            >
              {c.title}
            </Link>
          ))}
        </Block>
      )}
      {weak.untouchedSubjects.length > 0 && (
        <Block title="Matérias ainda não iniciadas">
          {weak.untouchedSubjects.map((s) => (
            <Link
              key={s.slug}
              href={`/biblioteca/${s.slug}`}
              className="flex justify-between rounded px-2 py-1 hover:bg-white/5"
            >
              <span className="text-foreground">{s.name}</span>
              <span className="text-muted">{s.total} conteúdos</span>
            </Link>
          ))}
        </Block>
      )}
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function PremiumLockCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary-soft">
      <CardBody>
        <div className="flex items-center gap-2 text-secondary">
          <Lock className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Premium
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted">{body}</p>
        <Link
          href="/precos"
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Assinar Premium
        </Link>
      </CardBody>
    </Card>
  );
}

/** re-export para páginas que mostram badge de recorrência em recomendações */
export function RecBadge({ recurrence }: { recurrence: string }) {
  return <RecurrenceBadge recurrence={recurrence as Recurrence} variant="dot" />;
}
