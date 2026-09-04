import { createServiceClient } from "@/lib/supabase/service";
import { bust } from "@/lib/cache";
import {
  evaluateAchievements,
  type AchievementStats,
} from "@/lib/gamification/achievements";
import { logError } from "@/lib/observability/log";

/**
 * Fase 14 — concessão de XP / streak / conquistas (lado servidor).
 * Tudo fail-open: sem `SUPABASE_SERVICE_ROLE_KEY` (modo demo) ou falha de rede,
 * a experiência principal segue intacta.
 */

const gamKey = (userId: string) => `gam:${userId}`;

export async function awardXp(
  userId: string,
  kind: string,
  amount: number,
  dedupe?: string | null,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    const db = createServiceClient();
    await db.rpc("grant_xp", {
      p_user: userId,
      p_kind: kind,
      p_amount: amount,
      p_dedupe: dedupe ?? null,
      p_meta: meta,
    });
    await bust(gamKey(userId));
  } catch {
    /* best-effort */
  }
}

export async function touchStreak(userId: string): Promise<number | null> {
  try {
    const db = createServiceClient();
    const { data } = await db.rpc("touch_streak", { p_user: userId });
    await bust(gamKey(userId));
    return typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

async function gatherStats(userId: string): Promise<AchievementStats> {
  const db = createServiceClient();
  const [
    gam,
    onb,
    reads,
    essays,
    chats,
    posts,
    refs,
  ] = await Promise.all([
    db
      .from("user_gamification")
      .select("xp, level, current_streak, longest_streak")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("user_onboarding")
      .select("completed")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "content_read"),
    db
      .from("essay_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "corrigida"),
    db
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user"),
    db
      .from("community_group_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    db
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .in("status", ["qualified", "rewarded"]),
  ]);

  return {
    onboardingDone: !!onb.data?.completed,
    xp: gam.data?.xp ?? 0,
    level: gam.data?.level ?? 1,
    streak: gam.data?.current_streak ?? 0,
    longestStreak: gam.data?.longest_streak ?? 0,
    contentReads: reads.count ?? 0,
    essaysCorrected: essays.count ?? 0,
    chatMessages: chats.count ?? 0,
    communityPosts: posts.count ?? 0,
    referralsQualified: refs.count ?? 0,
  };
}

/**
 * Reavalia as conquistas do usuário e persiste as novas. Retorna os ids
 * recém-desbloqueados (para o toast).
 */
export async function syncAchievements(userId: string): Promise<string[]> {
  try {
    const db = createServiceClient();
    const stats = await gatherStats(userId);
    const met = new Set(evaluateAchievements(stats));

    const { data: existing } = await db
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);
    const have = new Set((existing ?? []).map((r) => r.achievement_id));

    const fresh = [...met].filter((id) => !have.has(id));
    if (fresh.length === 0) return [];

    await db
      .from("user_achievements")
      .upsert(
        fresh.map((achievement_id) => ({ user_id: userId, achievement_id })),
        { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
      );

    for (const id of fresh) {
      await db.rpc("grant_xp", {
        p_user: userId,
        p_kind: "achievement",
        p_amount: 25,
        p_dedupe: `ach:${id}`,
        p_meta: { achievement: id },
      });
    }
    await bust(gamKey(userId));
    return fresh;
  } catch (e) {
    await logError("gamification.syncAchievements", e, {}, userId);
    return [];
  }
}

/**
 * Ponto único chamado após uma ação relevante: garante o registro, dá o XP
 * da ação (idempotente por `dedupe`) e reavalia conquistas.
 */
export async function onActivity(
  userId: string,
  opts: { kind: string; amount: number; dedupe?: string | null }
): Promise<{ unlocked: string[] }> {
  await awardXp(userId, opts.kind, opts.amount, opts.dedupe ?? null);
  const unlocked = await syncAchievements(userId);
  return { unlocked };
}
