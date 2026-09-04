"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "resumo";

/** Remove informações pessoais óbvias (spec §12). */
function stripPersonal(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[e-mail removido]")
    .replace(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g, "[telefone removido]")
    .replace(/^\s*(por|autor|nome)\s*:.*$/gim, "")
    .trim();
}

/** Usuário envia um resumo do Chat para a fila de revisão (spec §12). */
export async function submitSummaryToLibrary(input: {
  title: string;
  content: string;
  suggestedSubject?: string;
  suggestedTopic?: string;
  conversationId?: string;
}) {
  const user = await requireUser();
  if (input.content.trim().length < 200) {
    return { ok: false as const, error: "resumo_curto" };
  }
  const supabase = createClient();
  const { error } = await supabase.from("community_library_submissions").insert({
    user_id: user.id,
    title: input.title.trim().slice(0, 140) || "Resumo enviado",
    content: input.content.trim(),
    suggested_subject: input.suggestedSubject?.trim() ?? null,
    suggested_topic: input.suggestedTopic?.trim() ?? null,
    source_conversation_id: input.conversationId ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** Admin revisa um envio (spec §12: aprovar / reprovar / solicitar ajustes). */
export async function reviewSubmission(
  id: string,
  decision: "aprovado" | "reprovado" | "ajustes",
  note?: string
) {
  const user = await requireUser();
  if (!(await isAppAdmin(user.id)))
    return { ok: false as const, error: "forbidden" };

  const supabase = createClient();
  const { data: sub } = await supabase
    .from("community_library_submissions")
    .select("id, user_id, title, content, suggested_subject, suggested_topic, status")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return { ok: false as const, error: "not_found" };

  if (decision !== "aprovado") {
    await supabase
      .from("community_library_submissions")
      .update({ status: decision, admin_note: note ?? null, reviewed_by: user.id })
      .eq("id", id);
    await supabase.rpc("community_notify", {
      p_user: sub.user_id,
      p_kind: "summary_reviewed",
      p_title:
        decision === "reprovado"
          ? "Seu resumo enviado não foi aprovado"
          : "Seu resumo enviado precisa de ajustes",
      p_href: "/comunidade/notificacoes",
    });
    revalidatePath("/comunidade/admin");
    return { ok: true as const };
  }

  // aprovado → publicar na Biblioteca (spec §12)
  const subjectName = sub.suggested_subject?.trim() || "Enviados pela comunidade";
  const subjectSlug = slugify(subjectName);

  let { data: subject } = await supabase
    .from("library_subjects")
    .select("id, slug")
    .eq("slug", subjectSlug)
    .maybeSingle();
  if (!subject) {
    const ins = await supabase
      .from("library_subjects")
      .insert({
        area: "linguagens",
        slug: subjectSlug,
        name: subjectName,
        description: "Conteúdos enviados por estudantes e revisados pela equipe.",
        icon: "Users",
        position: 99,
      })
      .select("id, slug")
      .single();
    subject = ins.data;
  }
  if (!subject) return { ok: false as const, error: "subject_failed" };

  const topicName = sub.suggested_topic?.trim() || sub.title;
  const topicSlug = slugify(topicName) + "-" + Math.random().toString(36).slice(2, 5);
  const { data: topic } = await supabase
    .from("library_topics")
    .insert({ subject_id: subject.id, slug: topicSlug, name: topicName, position: 99 })
    .select("id")
    .single();
  if (!topic) return { ok: false as const, error: "topic_failed" };

  const body = [
    "> Resumo enviado pela comunidade e revisado pela equipe COGNI IA.",
    "",
    stripPersonal(sub.content),
  ].join("\n");
  const summaryShort = stripPersonal(sub.content)
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 6)
    .join("\n");

  const contentSlug =
    slugify(sub.title) + "-" + Math.random().toString(36).slice(2, 6);

  const { data: content } = await supabase
    .from("library_contents")
    .insert({
      topic_id: topic.id,
      subject_id: subject.id,
      slug: contentSlug,
      title: sub.title,
      summary_short: summaryShort || sub.title,
      recurrence: "ocasional",
      reading_minutes: Math.max(4, Math.round(sub.content.length / 900)),
      is_published: true,
      position: 99,
    })
    .select("id")
    .single();
  if (!content) return { ok: false as const, error: "content_failed" };

  await supabase
    .from("library_content_premium")
    .insert({ content_id: content.id, body });

  await supabase
    .from("community_library_submissions")
    .update({
      status: "aprovado",
      admin_note: note ?? null,
      reviewed_by: user.id,
      published_content_id: content.id,
    })
    .eq("id", id);

  await supabase.rpc("community_notify", {
    p_user: sub.user_id,
    p_kind: "summary_accepted",
    p_title: `Seu resumo "${sub.title.slice(0, 50)}" foi publicado na Biblioteca!`,
    p_href: `/biblioteca/${subject.slug}/${contentSlug}`,
  });

  revalidatePath("/comunidade/admin");
  revalidatePath("/biblioteca");
  return { ok: true as const };
}
