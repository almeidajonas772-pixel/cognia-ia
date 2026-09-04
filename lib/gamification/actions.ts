"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth";
import { bust } from "@/lib/cache";

/** Fase 14 — Server Actions de gamificação. */

export async function markAchievementsSeen() {
  const user = await requireUser();
  try {
    const db = createClient(); // RLS: update dos próprios registros
    await db
      .from("user_achievements")
      .update({ seen: true })
      .eq("user_id", user.id)
      .eq("seen", false);
  } catch {
    /* best-effort */
  }
  revalidatePath("/conquistas");
  return { ok: true as const };
}

export async function setWeeklyGoal(minutes: number) {
  const user = await requireUser();
  const clamped = Math.max(30, Math.min(1200, Math.round(minutes / 15) * 15));
  try {
    const db = createServiceClient();
    await db.rpc("ensure_gamification", { p_user: user.id });
    await db
      .from("user_gamification")
      .update({ weekly_goal_minutes: clamped })
      .eq("user_id", user.id);
    await bust(`gam:${user.id}`);
  } catch {
    return { ok: false as const };
  }
  revalidatePath("/dashboard");
  revalidatePath("/conquistas");
  return { ok: true as const, minutes: clamped };
}
