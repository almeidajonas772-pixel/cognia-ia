import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { logError } from "@/lib/observability/log";
import { touchStreak, awardXp, syncAchievements } from "@/lib/gamification/award";

export const dynamic = "force-dynamic";

/** Heartbeat de tempo de estudo (spec §1) + streak/XP diários (Fase 14). */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const supabase = createClient();
  const { error } = await supabase.rpc("study_ping", { p_user: user.id });
  if (error) {
    await logError("study.ping", error, {}, user.id);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Streak: barato (o SQL retorna cedo se já marcou hoje).
  const streak = await touchStreak(user.id);

  // XP diário + conquistas: no máximo 1x/dia/instância (grant_xp já é idempotente).
  const today = new Date().toISOString().slice(0, 10);
  const mark = `ping-gam:${user.id}:${today}`;
  let unlocked: string[] = [];
  if (!(await cacheGet(mark))) {
    await cacheSet(mark, 1, 86400);
    await awardXp(user.id, "daily_active", 15, `daily:${today}`);
    unlocked = await syncAchievements(user.id);
  }

  return NextResponse.json({ ok: true, streak, unlocked });
}
