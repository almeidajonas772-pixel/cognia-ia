"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";

async function admin() {
  const user = await requireUser();
  const ok = await isAppAdmin(user.id);
  return { user, ok };
}

export async function adminModeratePost(
  id: string,
  decision: "aprovar" | "remover"
) {
  const { ok } = await admin();
  if (!ok) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  if (decision === "aprovar") {
    await supabase
      .from("community_group_posts")
      .update({ moderation: "aprovado" })
      .eq("id", id);
  } else {
    await supabase.from("community_group_posts").delete().eq("id", id);
  }
  revalidatePath("/comunidade/admin");
  return { ok: true as const };
}

export async function adminSetPostFlag(
  id: string,
  patch: { pinned?: boolean; official?: boolean }
) {
  const { ok } = await admin();
  if (!ok) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase.from("community_group_posts").update(patch).eq("id", id);

  if (patch.official || patch.pinned) {
    const { data: p } = await supabase
      .from("community_group_posts")
      .select("user_id, title")
      .eq("id", id)
      .maybeSingle();
    if (p?.user_id) {
      await supabase.rpc("community_notify", {
        p_user: p.user_id,
        p_kind: "highlighted",
        p_title: `Sua publicação "${String(p.title).slice(0, 50)}" foi destacada`,
        p_href: `/comunidade/p/${id}`,
      });
    }
  }
  revalidatePath("/comunidade/admin");
  revalidatePath(`/comunidade/p/${id}`);
  return { ok: true as const };
}

export async function adminResolveReport(id: string) {
  const { ok } = await admin();
  if (!ok) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase
    .from("community_reports")
    .update({ resolved: true })
    .eq("id", id);
  revalidatePath("/comunidade/admin");
  return { ok: true as const };
}

export async function adminCreateOfficialGroup(input: {
  name: string;
  slug: string;
  description?: string;
  category?: string;
}) {
  const { user, ok } = await admin();
  if (!ok) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_groups")
    .insert({
      slug: input.slug,
      name: input.name.trim().slice(0, 80),
      description: input.description?.trim() ?? null,
      category: input.category?.trim() || "Geral",
      official: true,
      created_by: user.id,
    })
    .select("slug")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };
  revalidatePath("/comunidade");
  return { ok: true as const, slug: data.slug };
}
