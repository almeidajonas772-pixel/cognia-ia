import type { UserProfile } from "@/lib/supabase/types";

/**
 * Regra de acesso da Fase 3:
 *   - Plano gratuito: só o RESUMO RÁPIDO.
 *   - Plano Premium: RESUMO COMPLETO + download + acesso ilimitado.
 *
 * Os limites de navegação diária e os anúncios ficam para a Fase 8.
 */
export function canAccessFullSummary(profile: UserProfile | null): boolean {
  return profile?.plan === "premium";
}
