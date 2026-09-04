"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { bustOnboarding } from "@/lib/onboarding/queries";
import { logEvent } from "@/lib/observability/log";
import { awardXp, syncAchievements } from "@/lib/gamification/award";
import type { Goal, Level } from "@/lib/onboarding/types";

/**
 * Fase 13 — Server Actions do onboarding. Escrita via cliente de SESSÃO
 * (RLS de `user_onboarding` e `chat_user_memory` exige `auth.uid()`).
 */

export type OnboardingInput = {
  goal: Goal | null;
  examDate: string | null;
  targetCourse: string | null;
  focusAreas: string[];
  level: Level | null;
};

const LEVEL_TO_DEPTH: Record<Level, "basico" | "intermediario" | "avancado"> = {
  basico: "basico",
  intermediario: "intermediario",
  avancado: "avancado",
};

export async function saveOnboarding(input: OnboardingInput) {
  const user = await requireUser();
  const db = createClient();

  const { error } = await db.from("user_onboarding").upsert(
    {
      user_id: user.id,
      goal: input.goal,
      exam_date: input.examDate || null,
      target_course: input.targetCourse?.trim() || null,
      focus_areas: input.focusAreas.slice(0, 8),
      level: input.level,
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false as const, error: error.message };

  // Semeia a memória da IA (Fase 4) para personalizar desde a 1ª conversa.
  if (input.level) {
    await db
      .from("chat_user_memory")
      .upsert(
        { user_id: user.id, level: LEVEL_TO_DEPTH[input.level] },
        { onConflict: "user_id" }
      );
  }

  await bustOnboarding(user.id);
  revalidatePath("/bem-vindo");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function completeOnboarding() {
  const user = await requireUser();
  const db = createClient();
  const { error } = await db.rpc("complete_onboarding", {});
  if (error) return { ok: false as const, error: error.message };
  await bustOnboarding(user.id);

  // Fase 14 — recompensa + qualifica a indicação + reavalia conquistas.
  await awardXp(user.id, "onboarding", 50, "onboarding");
  try {
    await db.rpc("qualify_referral", {});
  } catch {
    /* best-effort */
  }
  await syncAchievements(user.id);

  await logEvent({ source: "onboarding", message: "concluído", userId: user.id });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function skipOnboarding() {
  return completeOnboarding();
}

export async function markFirstStep(stepId: string) {
  const user = await requireUser();
  const db = createClient();
  const { data: row } = await db
    .from("user_onboarding")
    .select("steps_done")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = new Set(row?.steps_done ?? []);
  if (current.has(stepId)) return { ok: true as const };
  current.add(stepId);

  await db
    .from("user_onboarding")
    .upsert(
      { user_id: user.id, steps_done: [...current] },
      { onConflict: "user_id" }
    );
  await bustOnboarding(user.id);
  revalidatePath("/dashboard");
  return { ok: true as const };
}
