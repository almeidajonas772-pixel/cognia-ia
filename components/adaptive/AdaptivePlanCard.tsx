import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getAdaptivePlan } from "@/lib/ai/adaptive";

/**
 * Fase 15 — "Plano de hoje" adaptativo. Server component. Não renderiza nada
 * enquanto não houver sinal suficiente (usuário muito novo).
 */
export async function AdaptivePlanCard({ userId }: { userId: string }) {
  const steps = await getAdaptivePlan(userId);
  if (steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-secondary" />
        <p className="text-sm font-semibold text-foreground">Seu plano de hoje</p>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        Priorizado a partir do que a plataforma aprendeu sobre você.
      </p>

      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-secondary/40"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-secondary">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {s.title}
                </span>
                <span className="block text-xs text-muted">{s.detail}</span>
              </span>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs text-secondary">
                {s.cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
