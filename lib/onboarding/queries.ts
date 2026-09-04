import { createServiceClient } from "@/lib/supabase/service";
import { cached, bust } from "@/lib/cache";
import { EMPTY_ONBOARDING, type OnboardingState } from "@/lib/onboarding/types";

/**
 * Fase 13 — leitura do estado de onboarding. Fail-open (modo demo / falha de
 * banco → considera "não iniciado", sem bloquear nada). Cacheado ~60s por
 * usuário; `bustOnboarding` na escrita.
 */

const key = (userId: string) => `onboarding:${userId}`;

export async function getOnboarding(userId: string): Promise<OnboardingState> {
  return cached(key(userId), 60, async () => {
    try {
      const db = createServiceClient();
      const { data } = await db
        .from("user_onboarding")
        .select(
          "completed, goal, exam_date, target_course, focus_areas, level, steps_done"
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return { ...EMPTY_ONBOARDING };
      return {
        completed: data.completed,
        goal: (data.goal as OnboardingState["goal"]) ?? null,
        examDate: data.exam_date,
        targetCourse: data.target_course,
        focusAreas: data.focus_areas ?? [],
        level: (data.level as OnboardingState["level"]) ?? null,
        stepsDone: data.steps_done ?? [],
      };
    } catch {
      return { ...EMPTY_ONBOARDING };
    }
  });
}

export async function bustOnboarding(userId: string): Promise<void> {
  await bust(key(userId));
}
