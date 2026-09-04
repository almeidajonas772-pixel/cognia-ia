import Link from "next/link";
import { Lock, Check } from "lucide-react";

/**
 * Mostrado no lugar do RESUMO COMPLETO para usuários do plano gratuito.
 * O checkout de verdade entra na Fase 8; aqui o CTA leva ao perfil.
 */
export function PremiumLock() {
  const perks = [
    "Resumo completo no padrão dos guias de estudo",
    "20 questões com gabarito comentado",
    "Download do material (.doc)",
    "Acesso ilimitado e sem anúncios",
  ];

  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft p-6">
      <div className="flex items-center gap-2 text-secondary">
        <Lock className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Resumo completo · Premium
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-foreground">
        Este resumo aprofundado é um recurso Premium
      </h3>
      <p className="mt-1 text-sm text-muted">
        No plano gratuito você tem o resumo rápido acima. O resumo completo traz
        a explicação exaustiva, tabelas comparativas e questões comentadas.
      </p>

      <ul className="mt-4 space-y-2">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            {p}
          </li>
        ))}
      </ul>

      <Link
        href="/precos"
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Assinar Premium
      </Link>
    </div>
  );
}
