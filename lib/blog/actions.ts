"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { logAdmin } from "@/lib/admin/logs";
import { bust } from "@/lib/cache";

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
    .slice(0, 80) || "artigo";

const readingMinutes = (text: string) =>
  Math.max(2, Math.round(text.trim().split(/\s+/).length / 200));

export type BlogInput = {
  id?: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string;
  keywords?: string;
  seoTitle?: string;
  seoDescription?: string;
  action: "rascunho" | "publicar" | "agendar";
  scheduledFor?: string;
};

export async function saveBlogPost(input: BlogInput) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();

  const status =
    input.action === "publicar"
      ? "publicado"
      : input.action === "agendar"
        ? "agendado"
        : "rascunho";

  const payload = {
    title: input.title.trim().slice(0, 200),
    subtitle: input.subtitle?.trim() || null,
    excerpt: input.excerpt?.trim() || null,
    content: input.content,
    cover_image_url: input.coverImageUrl?.trim() || null,
    category: input.category?.trim() || "Estudos",
    tags: parseList(input.tags),
    keywords: parseList(input.keywords),
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    reading_minutes: readingMinutes(input.content),
    status: status as "rascunho" | "agendado" | "publicado",
    published_at:
      input.action === "publicar" ? new Date().toISOString() : null,
    scheduled_for:
      input.action === "agendar" ? input.scheduledFor ?? null : null,
  };

  let error: { message: string } | null;
  let slug = "";
  if (input.id) {
    ({ error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", input.id));
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("id", input.id)
      .maybeSingle();
    slug = data?.slug ?? "";
    await logAdmin("edit_blog_post", { type: "blog_post", id: input.id });
  } else {
    slug = slugify(input.title) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error: e } = await supabase
      .from("blog_posts")
      .insert({ ...payload, slug })
      .select("id, slug")
      .single();
    error = e;
    slug = data?.slug ?? slug;
    if (data) await logAdmin("create_blog_post", { type: "blog_post", id: data.id });
  }
  if (error) return { ok: false as const, error: error.message };

  await bust("blog:");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  return { ok: true as const, slug };
}

export async function setBlogStatus(id: string, publish: boolean) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase
    .from("blog_posts")
    .update({
      status: publish ? "publicado" : "rascunho",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", id);
  await logAdmin(publish ? "publish_blog_post" : "unpublish_blog_post", {
    type: "blog_post",
    id,
  });
  await bust("blog:");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true as const };
}

export async function deleteBlogPost(id: string) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  await logAdmin("delete_blog_post", { type: "blog_post", id });
  await bust("blog:");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true as const };
}

function parseList(s?: string): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}
