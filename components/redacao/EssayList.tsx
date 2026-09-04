import Link from "next/link";
import { FileText, Image as ImageIcon, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getBanca } from "@/lib/redacao/bancas";
import type { EssaySubmission } from "@/lib/redacao/types";

const STATUS_META: Record<
  EssaySubmission["status"],
  { label: string; className: string }
> = {
  rascunho: { label: "Rascunho", className: "text-muted" },
  aguardando_transcricao: {
    label: "Confira a transcrição",
    className: "text-amber-400",
  },
  transcricao_confirmada: { label: "Pronta para corrigir", className: "text-secondary" },
  corrigindo: { label: "Corrigindo…", className: "text-secondary" },
  corrigida: { label: "Corrigida", className: "text-emerald-400" },
  erro: { label: "Não avaliada", className: "text-rose-400" },
};

export function EssayList({ essays }: { essays: EssaySubmission[] }) {
  if (essays.length === 0) {
    return (
      <p className="text-sm text-muted">
        Você ainda não enviou nenhuma redação.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {essays.map((e) => {
        const banca = getBanca(e.banca);
        const st = STATUS_META[e.status];
        const Icon =
          e.status === "corrigida"
            ? CheckCircle2
            : e.status === "erro"
              ? AlertCircle
              : e.source === "texto"
                ? FileText
                : ImageIcon;
        return (
          <Link
            key={e.id}
            href={`/redacao/${e.id}`}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {e.title}
              </p>
              <p className="flex items-center gap-2 text-xs text-muted">
                <span>{e.banca === "custom" ? "Rubrica personalizada" : banca?.name ?? e.banca}</span>
                <span>·</span>
                <span className={st.className}>{st.label}</span>
              </p>
            </div>
            {e.status === "corrigida" && e.grade != null && e.grade_max ? (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {e.grade}
                <span className="text-xs font-normal text-muted">
                  /{e.grade_max}
                </span>
              </span>
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
