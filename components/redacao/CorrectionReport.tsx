import { Target, AlertTriangle } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { DonutProgress } from "@/components/progresso/Charts";
import { ErrorList } from "@/components/redacao/ErrorList";
import { ImprovementList } from "@/components/redacao/ImprovementList";
import { getBanca } from "@/lib/redacao/bancas";
import {
  MODE_LABEL,
  TYPE_LABEL,
  type EssaySubmission,
} from "@/lib/redacao/types";
import type { ErrorBankEntry } from "@/lib/redacao/queries";

export function CorrectionReport({
  essay,
  errorBank,
}: {
  essay: EssaySubmission;
  errorBank: ErrorBankEntry[];
}) {
  const grade = essay.grade ?? 0;
  const max = essay.grade_max ?? 1;
  const pct = Math.round((grade / max) * 100);
  const banca =
    essay.banca === "custom"
      ? "Rubrica personalizada"
      : (getBanca(essay.banca)?.name ?? essay.banca);
  const comps = essay.competencies ?? [];
  const gap = essay.max_score_gap;
  const recurring: Record<string, number> = {};
  for (const e of errorBank) recurring[e.signature] = e.occurrences;

  return (
    <div className="space-y-6">
      {/* nota final */}
      <Card>
        <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <DonutProgress value={pct} label={`${grade}`} sublabel={`de ${max}`} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-wide text-muted">
              {banca} · {TYPE_LABEL[essay.correction_type]} · {MODE_LABEL[essay.mode]}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {grade}
              <span className="text-lg font-normal text-muted">/{max}</span>
            </p>
            {essay.summary && (
              <p className="mt-1 text-sm text-muted">{essay.summary}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* notas por competência */}
      {comps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notas por competência</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {comps.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="tabular-nums text-muted">
                    {c.score}/{c.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.round((c.score / (c.max || 1)) * 100)}%`,
                    }}
                  />
                </div>
                {c.comment && (
                  <p className="mt-1 text-xs text-muted">{c.comment}</p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* pontos para melhorar (feedback obrigatório §12) */}
      <Card>
        <CardHeader>
          <CardTitle>Pontos para melhorar</CardTitle>
        </CardHeader>
        <CardBody>
          <ImprovementList items={essay.improvements ?? []} />
        </CardBody>
      </Card>

      {/* análise de erros */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de erros</CardTitle>
        </CardHeader>
        <CardBody>
          <ErrorList errors={essay.errors ?? []} recurring={recurring} />
        </CardBody>
      </Card>

      {/* comparação com nota máxima (§8) */}
      {gap && (gap.missing.length || gap.limiting.length || gap.toPerfect.length) ? (
        <Card>
          <CardHeader>
            <CardTitle>Para chegar à nota máxima</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 text-sm">
            {gap.limiting.length > 0 && (
              <GapBlock
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                title="O que mais limitou a nota"
                items={gap.limiting}
              />
            )}
            {gap.missing.length > 0 && (
              <GapBlock title="O que faltou" items={gap.missing} />
            )}
            {gap.toPerfect.length > 0 && (
              <GapBlock
                icon={<Target className="h-3.5 w-3.5" />}
                title="Ajustes que levariam ao nível máximo"
                items={gap.toPerfect}
              />
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function GapBlock({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-foreground">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
