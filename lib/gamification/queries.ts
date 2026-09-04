import { createServiceClient } from "@/lib/supabase/service";
import { cached } from "@/lib/cache";
import { levelProgress, type LevelProgress } from "@/lib/gamification/xp";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/lib/gamification/achievements";

/**
 * Fase 14 — leituras de gamificação para a UI. Fail-open (valores zerados).
 */

export type Gamification = {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  weeklyGoalMinutes: number;
  lastActiveDate: string | null;
  progress: LevelProgress;
  weekMinutes: number;
  weekXp: number;
};

const EMPTY: Gamification = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  streakFreezes: 0,
  weeklyGoalMinutes: 150,
  lastActiveDate: null,
  progress: levelProgress(0),
  weekMinutes: 0,
  weekXp: 0,
};

export async function getGamification(userId: string): Promise<Gamification> {
  return cached(`gam:${userId}`, 30, async () => {
    try {
      const db = createServiceClient();
      const weekAgo = new Date(Date.now() - 7 * 86400_000);
      const dayKey = weekAgo.toISOString().slice(0, 10);

      const [gam, mins, xpw] = await Promise.all([
        db
          .from("user_gamification")
          .select(
            "xp, level, current_streak, longest_streak, streak_freezes, weekly_goal_minutes, last_active_date"
          )
          .eq("user_id", userId)
          .maybeSingle(),
        db
          .from("study_daily")
          .select("minutes")
          .eq("user_id", userId)
          .gte("day", dayKey),
        db
          .from("xp_events")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", weekAgo.toISOString()),
      ]);

      const g = gam.data;
      const xp = g?.xp ?? 0;
      return {
        xp,
        level: g?.level ?? 1,
        currentStreak: g?.current_streak ?? 0,
        longestStreak: g?.longest_streak ?? 0,
        streakFreezes: g?.streak_freezes ?? 0,
        weeklyGoalMinutes: g?.weekly_goal_minutes ?? 150,
        lastActiveDate: g?.last_active_date ?? null,
        progress: levelProgress(xp),
        weekMinutes: (mins.data ?? []).reduce((a, r) => a + (r.minutes ?? 0), 0),
        weekXp: (xpw.data ?? []).reduce((a, r) => a + (r.amount ?? 0), 0),
      };
    } catch {
      return EMPTY;
    }
  });
}

export type AchievementsView = {
  unlocked: { id: string; unlockedAt: string; seen: boolean }[];
  unlockedIds: Set<string>;
  total: number;
  newUnseen: number;
  catalog: typeof ACHIEVEMENTS;
};

export async function getAchievementsView(userId: string): Promise<AchievementsView> {
  const base: AchievementsView = {
    unlocked: [],
    unlockedIds: new Set(),
    total: ACHIEVEMENTS.length,
    newUnseen: 0,
    catalog: ACHIEVEMENTS,
  };
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_achievements")
      .select("achievement_id, unlocked_at, seen")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    const unlocked = (data ?? [])
      .filter((r) => ACHIEVEMENT_MAP[r.achievement_id])
      .map((r) => ({ id: r.achievement_id, unlockedAt: r.unlocked_at, seen: r.seen }));

    return {
      ...base,
      unlocked,
      unlockedIds: new Set(unlocked.map((u) => u.id)),
      newUnseen: unlocked.filter((u) => !u.seen).length,
    };
  } catch {
    return base;
  }
}

export type LeaderboardRow = { rank: number; xp: number; isMe: boolean; label: string };
export type Leaderboard = { top: LeaderboardRow[]; me: LeaderboardRow | null };

/** Ranking semanal por XP ganho nos últimos 7 dias. Anonimizado (só o "você"). */
export async function getWeeklyLeaderboard(userId: string): Promise<Leaderboard> {
  try {
    const db = createServiceClient();
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data } = await db
      .from("xp_events")
      .select("user_id, amount")
      .gte("created_at", since)
      .limit(50000);

    const totals = new Map<string, number>();
    for (const r of data ?? [])
      totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.amount ?? 0));

    const ranked = [...totals.entries()]
      .map(([uid, xp]) => ({ uid, xp }))
      .sort((a, b) => b.xp - a.xp);

    const meIndex = ranked.findIndex((r) => r.uid === userId);
    const top: LeaderboardRow[] = ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      xp: r.xp,
      isMe: r.uid === userId,
      label: r.uid === userId ? "Você" : `Estudante ${i + 1}`,
    }));

    const me: LeaderboardRow | null =
      meIndex >= 0
        ? {
            rank: meIndex + 1,
            xp: ranked[meIndex].xp,
            isMe: true,
            label: "Você",
          }
        : null;

    return { top, me };
  } catch {
    return { top: [], me: null };
  }
}
