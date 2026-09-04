"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { logAdmin } from "@/lib/admin/logs";
import { bust } from "@/lib/cache";
import type { Recurrence } from "@/lib/biblioteca/types";

async function guard() {
  const user = await requireUser();
  return (await isAppAdmin(user.id)) ? user : null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "item";

export async function saveContent(input: {
  id?: string;
  subjectId: string;
  topicId: string;
  title: string;
  summaryShort: string;
  body: string;
  recurrence: Recurrence;
  readingMinutes: number;
  isPublished: boolean;
}) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();

  if (input.id) {
    const { error } = await supabase
      .from("library_contents")
      .update({
        title: input.title.trim(),
        summary_short: input.summaryShort,
        recurrence: input.recurrence,
        reading_minutes: input.readingMinutes,
        is_published: input.isPublished,
      })
      .eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await supabase
      .from("library_content_premium")
      .upsert({ content_id: input.id, body: input.body }, { onConflict: "content_id" });
    await logAdmin("edit_content", { type: "library_content", id: input.id });
  } else {
    const slug =
      slugify(input.title) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("library_contents")
      .insert({
        topic_id: input.topicId,
        subject_id: input.subjectId,
        slug,
        title: input.title.trim(),
        summary_short: input.summaryShort,
        recurrence: input.recurrence,
        reading_minutes: input.readingMinutes,
        is_published: input.isPublished,
        position: 50,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false as const, error: error?.message };
    await supabase
      .from("library_content_premium")
      .insert({ content_id: data.id, body: input.body });
    await logAdmin("create_content", { type: "library_content", id: data.id });
  }

  await bust("biblioteca:");
  revalidatePath("/admin/biblioteca");
  revalidatePath("/biblioteca");
  return { ok: true as const };
}

export async function deleteContent(id: string) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase.from("library_contents").delete().eq("id", id);
  await logAdmin("delete_content", { type: "library_content", id });
  await bust("biblioteca:");
  revalidatePath("/admin/biblioteca");
  revalidatePath("/biblioteca");
  return { ok: true as const };
}

export async function setContentRecurrence(id: string, recurrence: Recurrence) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase
    .from("library_contents")
    .update({ recurrence })
    .eq("id", id);
  await logAdmin("set_recurrence", {
    type: "library_content",
    id,
    detail: { recurrence },
  });
  revalidatePath("/admin/biblioteca");
  return { ok: true as const };
}

export async function createTopic(input: {
  subjectId: string;
  name: string;
}) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const slug = slugify(input.name) + "-" + Math.random().toString(36).slice(2, 5);
  const { data, error } = await supabase
    .from("library_topics")
    .insert({
      subject_id: input.subjectId,
      slug,
      name: input.name.trim(),
      position: 50,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };
  await logAdmin("create_topic", { type: "library_topic", id: data.id });
  await bust("biblioteca:");
  revalidatePath("/admin/biblioteca");
  return { ok: true as const, id: data.id };
}
