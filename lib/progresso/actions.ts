"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { DifficultyLevel } from "@/lib/progresso/types";

/** Registra a dificuldade percebida de um conteúdo (spec §1). */
export async function rateDifficulty(input: {
  contentId: string;
  level: DifficultyLevel;
  subjectSlug: string;
  contentSlug: string;
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("content_difficulty").upsert(
    {
      user_id: user.id,
      content_id: input.contentId,
      level: input.level,
    },
    { onConflict: "user_id,content_id" }
  );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/biblioteca/${input.subjectSlug}/${input.contentSlug}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}
