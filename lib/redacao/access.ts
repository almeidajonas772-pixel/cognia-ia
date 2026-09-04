import type { UserProfile } from "@/lib/supabase/types";

/**
 * O módulo de Redação é exclusivo do Plano Premium
 * (spec Fase 3 §5 e Fase 8: "não possuir acesso ao módulo de Redação").
 */
export function canUseRedacao(profile: UserProfile | null): boolean {
  return profile?.plan === "premium";
}
