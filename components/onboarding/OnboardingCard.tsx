import Link from "next/link";
import { Rocket, ArrowRight } from "lucide-react";
import { getOnboarding } from "@/lib/onboarding/queries";
import { FIRST_STEPS } from "@/lib/onboarding/types";
import { DismissOnboardingButton } from "@/components/onboarding/DismissOnboardingButton";
import { FirstStepLink } from "@/components/onboarding/FirstStepLink";

/**
 * Fase 13 — cartão de primeiros passos no topo do dashboard. Some quando o
 * onboarding é concluído ou dispensado. Server component.
 */
export async function OnboardingCard({ userId }: { userId: string }) {
  const state = await getOnboarding(userId);
  if (state.completed) return null;

  const done = new Set(state.stepsDone);
  const hasProfile = !!state.goal || !!state.level || state.focusAreas.length > 0;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-secondary" />
          <p className="text-sm font-semibold text-foreground">
            {hasProfile ? "Continue de onde parou" : "Vamos começar?"}
          </p>
        </div>
        <DismissOnboardingButton />
      </div>

      <p className="mt-1 text-xs text-muted">
        {hasProfile
          ? "Seu plano de estudos já está personalizado. Faça o primeiro passo:"
          : "Leva 1 minuto para personalizar a plataforma para o seu objetivo."}
      </p>

      {!hasProfile && (
        <Link
          href="/bem-vindo"
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Personalizar meus estudos <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {FIRST_STEPS.map((s) => (
          <li key={s.id}>
            <FirstStepLink
              id={s.id}
              label={s.label}
              href={s.href}
              done={done.has(s.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
