"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, requireUser } from "@/lib/auth";
import { FAVORITE_TYPE } from "@/lib/biblioteca/types";
import { logActivity } from "@/lib/progresso/activity";

/** Marca / desmarca um conteúdo como concluído (tabela `progress` da Fase 2). */
export async function setContentCompleted(input: {
  subjectSlug: string;
  contentSlug: string;
  completed: boolean;
  contentId?: string;
  title?: string;
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      subject: input.subjectSlug,
      topic: input.contentSlug,
      completed: input.completed,
      completed_at: input.completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,subject,topic" }
  );
  if (error) return { ok: false, error: error.message };

  if (input.completed) {
    await logActivity({
      userId: user.id,
      kind: "content_completed",
      subjectSlug: input.subjectSlug,
      refId: input.contentId ?? null,
      refLabel: input.title ?? input.contentSlug,
      meta: { href: `/biblioteca/${input.subjectSlug}/${input.contentSlug}` },
    });
  }

  revalidatePath(`/biblioteca/${input.subjectSlug}/${input.contentSlug}`);
  revalidatePath(`/biblioteca/${input.subjectSlug}`);
  revalidatePath("/biblioteca");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Adiciona / remove dos favoritos (tabela `favorites` da Fase 2). */
export async function setContentFavorite(input: {
  contentId: string;
  subjectSlug: string;
  contentSlug: string;
  favorite: boolean;
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { error } = input.favorite
    ? await supabase.from("favorites").upsert(
        { user_id: user.id, item_type: FAVORITE_TYPE, item_id: input.contentId },
        { onConflict: "user_id,item_type,item_id" }
      )
    : await supabase.from("favorites").delete().match({
        user_id: user.id,
        item_type: FAVORITE_TYPE,
        item_id: input.contentId,
      });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/biblioteca/${input.subjectSlug}/${input.contentSlug}`);
  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  return { ok: true };
}

/** Registra a leitura ("continuar de onde parou" + histórico). Silencioso. */
export async function recordContentView(
  contentId: string,
  meta?: { subjectSlug?: string; title?: string; href?: string }
) {
  const user = await getUser();
  if (!user) return;
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("library_reading_history")
    .select("view_count")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .maybeSingle();

  await supabase.from("library_reading_history").upsert(
    {
      user_id: user.id,
      content_id: contentId,
      last_viewed_at: new Date().toISOString(),
      view_count: (existing?.view_count ?? 0) + 1,
    },
    { onConflict: "user_id,content_id" }
  );

  await logActivity({
    userId: user.id,
    kind: "content_read",
    subjectSlug: meta?.subjectSlug ?? null,
    refId: contentId,
    refLabel: meta?.title ?? null,
    meta: meta?.href ? { href: meta.href } : {},
  });
}
