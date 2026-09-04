import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FREE_LIMITS,
  FEATURE_META,
  UPGRADE_COPY,
  type Feature,
  type FreeLimits,
} from "@/lib/billing/config";

/** Chave de período para o contador (spec §5). */
function periodKey(kind: "dia" | "semana"): string {
  const d = new Date();
  if (kind === "dia") return d.toISOString().slice(0, 10);
  // semana ISO
  const t = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Limites configuráveis pelo admin (billing_config.plan_limits) sobre os defaults. */
export async function getFreeLimits(): Promise<FreeLimits> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("billing_config")
      .select("value")
      .eq("key", "plan_limits")
      .maybeSingle();
    const free = (data?.value as { free?: Partial<FreeLimits> } | null)?.free;
    return { ...DEFAULT_FREE_LIMITS, ...(free ?? {}) };
  } catch {
    return DEFAULT_FREE_LIMITS;
  }
}

export type Entitlements = {
  isPremium: boolean;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
  limits: FreeLimits;
};

/**
 * CONTROLE CENTRAL DE PERMISSÕES (spec §2).
 * Calcula o plano LIVE a partir das assinaturas (não confia só no cache
 * users.plan) e sincroniza o cache se houver divergência.
 */
export const getEntitlements = cache(async function getEntitlements(
  userId: string
): Promise<Entitlements> {
  const supabase = createClient();
  const [{ data: sub }, limits] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    getFreeLimits(),
  ]);

  const isPremium =
    sub?.status === "active" &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  // mantém users.plan coerente (barato; Fase 10 adiciona cron de expiração)
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if ((profile?.plan === "premium") !== isPremium) {
    await supabase.rpc("sync_user_plan", { p_user: userId });
  }

  return {
    isPremium: !!isPremium,
    cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
    periodEnd: sub?.current_period_end ?? null,
    limits,
  };
});

export type FeatureCheck =
  | { allowed: true; remaining: number | null; used: number }
  | { allowed: false; title: string; body: string; used: number; limit: number };

/** Verifica se o usuário pode usar a funcionalidade AGORA (backend — spec §2). */
export async function checkFeature(
  userId: string,
  feature: Feature
): Promise<FeatureCheck> {
  const ent = await getEntitlements(userId);
  if (ent.isPremium) return { allowed: true, remaining: null, used: 0 };

  const meta = FEATURE_META[feature];
  const limit = ent.limits[meta.limitKey];
  const period = periodKey(meta.period);

  const supabase = createClient();
  const { data } = await supabase
    .from("feature_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period", period)
    .maybeSingle();
  const used = data?.count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      title: UPGRADE_COPY.title,
      body:
        limit === 0
          ? `${cap(meta.label)} são um recurso Premium. ${UPGRADE_COPY.body}`
          : `Você usou seus ${limit} ${meta.label} ${
              meta.period === "dia" ? "de hoje" : "da semana"
            }. ${UPGRADE_COPY.body}`,
    };
  }
  return { allowed: true, remaining: limit - used, used };
}

/** Registra o uso (chamar DEPOIS de executar a ação). */
export async function consumeFeature(userId: string, feature: Feature, n = 1) {
  const meta = FEATURE_META[feature];
  const supabase = createClient();
  await supabase.rpc("bump_feature_usage", {
    p_user: userId,
    p_feature: feature,
    p_period: periodKey(meta.period),
    p_delta: n,
  });
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
