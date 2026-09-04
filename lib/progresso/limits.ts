import type { UserProfile } from "@/lib/supabase/types";

/**
 * Regras de negócio da Fase 5 (spec §9).
 *   Gratuito: progresso básico, favoritos limitados, histórico curto, sem
 *             analytics avançado nem recomendações inteligentes.
 *   Premium:  tudo liberado.
 * Na Fase 8 estes números migram para o painel administrativo.
 */
export const FREE_PROGRESS = {
  favoritesCap: 20,
  historyDays: 14,
  historyItems: 40,
  advancedAnalytics: false,
  smartRecommendations: false,
};

export const PREMIUM_PROGRESS = {
  favoritesCap: Infinity,
  historyDays: 3650,
  historyItems: 500,
  advancedAnalytics: true,
  smartRecommendations: true,
};

export function progressLimits(profile: UserProfile | null) {
  return profile?.plan === "premium" ? PREMIUM_PROGRESS : FREE_PROGRESS;
}

export function isPremium(profile: UserProfile | null) {
  return profile?.plan === "premium";
}
