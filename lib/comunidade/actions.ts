"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/progresso/activity";
import { moderateContent } from "@/lib/comunidade/moderation";
import { communityLimits } from "@/lib/comunidade/access";
import {
  FAVORITE_POST_TYPE,
  type Attachment,
  type PostKind,
  type ReportReason,
  type ReportTarget,
  type SourceRef,
} from "@/lib/comunidade/types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

export async function joinGroup(groupId: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("community_group_members")
    .upsert(
      { group_id: groupId, user_id: user.id, role: "membro" },
      { onConflict: "group_id,user_id" }
    );
  revalidatePath("/comunidade");
  return { ok: true as const };
}

export async function leaveGroup(groupId: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("community_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);
  revalidatePath("/comunidade");
  return { ok: true as const };
}

export async function createGroup(input: {
  name: string;
  description?: string;
  category?: string;
  visibility?: "publica" | "privada";
  rules?: string;
}) {
  const user = await requireUser();
  const profile = await getProfile();
  const visibility =
    input.visibility === "privada" &&
    communityLimits(profile).canCreatePrivateGroup
      ? "privada"
      : "publica";

  const supabase = createClient();
  const base = slugify(input.name) || "grupo";
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await supabase
    .from("community_groups")
    .insert({
      slug,
      name: input.name.trim().slice(0, 80),
      description: input.description?.trim() ?? null,
      category: input.category?.trim() || "Geral",
      visibility,
      rules: input.rules?.trim() ?? null,
      created_by: user.id,
    })
    .select("id, slug")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };

  await supabase
    .from("community_group_members")
    .insert({ group_id: data.id, user_id: user.id, role: "admin" });

  revalidatePath("/comunidade");
  return { ok: true as const, slug: data.slug };
}

export async function createPost(input: {
  groupId: string;
  kind: PostKind;
  title: string;
  content: string;
  attachments?: Attachment[];
  sourceRef?: SourceRef;
}) {
  const user = await requireUser();
  const supabase = createClient();

  // limite anti-spam (spec §19/§21)
  const profile = await getProfile();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("community_group_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= communityLimits(profile).postsPerDay) {
    return { ok: false as const, error: "limite_diario" };
  }

  const mod = await moderateContent(`${input.title}\n${input.content}`);
  if (mod.status === "bloqueado") {
    return { ok: false as const, error: "bloqueado", reason: mod.reason };
  }

  const { data, error } = await supabase
    .from("community_group_posts")
    .insert({
      group_id: input.groupId,
      user_id: user.id,
      kind: input.kind,
      title: input.title.trim().slice(0, 160),
      content: input.content.trim(),
      attachments: (input.attachments ?? []).slice(0, 6),
      source_ref: input.sourceRef ?? null,
      moderation: mod.status === "revisao" ? "revisao" : "aprovado",
      moderation_note: mod.reason,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };

  await logActivity({
    userId: user.id,
    kind: "community",
    refId: data.id,
    refLabel: input.title.slice(0, 60),
    meta: { href: `/comunidade/p/${data.id}` },
  });

  revalidatePath(`/comunidade`);
  return {
    ok: true as const,
    id: data.id,
    pendingReview: mod.status === "revisao",
  };
}

export async function updatePost(
  id: string,
  patch: { title?: string; content?: string; kind?: PostKind }
) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("community_group_posts")
    .update({
      ...(patch.title ? { title: patch.title.trim().slice(0, 160) } : {}),
      ...(patch.content ? { content: patch.content.trim() } : {}),
      ...(patch.kind ? { kind: patch.kind } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath(`/comunidade/p/${id}`);
  return { ok: true as const };
}

export async function deletePost(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  // RLS permite autor OU staff do grupo
  await supabase.from("community_group_posts").delete().eq("id", id);
  void user;
  revalidatePath("/comunidade");
  return { ok: true as const };
}

export async function toggleLike(postId: string, liked: boolean) {
  const user = await requireUser();
  const supabase = createClient();
  if (liked) {
    await supabase
      .from("community_post_likes")
      .upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id" });
  } else {
    await supabase
      .from("community_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  }
  return { ok: true as const };
}

export async function savePost(postId: string, saved: boolean) {
  const user = await requireUser();
  const supabase = createClient();
  if (saved) {
    await supabase.from("favorites").upsert(
      { user_id: user.id, item_type: FAVORITE_POST_TYPE, item_id: postId },
      { onConflict: "user_id,item_type,item_id" }
    );
  } else {
    await supabase.from("favorites").delete().match({
      user_id: user.id,
      item_type: FAVORITE_POST_TYPE,
      item_id: postId,
    });
  }
  revalidatePath("/favoritos");
  return { ok: true as const };
}

export async function addComment(input: {
  postId: string;
  parentId?: string | null;
  content: string;
}) {
  const user = await requireUser();
  const supabase = createClient();

  const mod = await moderateContent(input.content);
  if (mod.status === "bloqueado") {
    return { ok: false as const, error: "bloqueado", reason: mod.reason };
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: input.postId,
      user_id: user.id,
      parent_id: input.parentId ?? null,
      content: input.content.trim().slice(0, 4000),
      moderation: mod.status === "revisao" ? "revisao" : "aprovado",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };

  // notifica autor da publicação e do comentário pai (spec §14)
  const { data: post } = await supabase
    .from("community_group_posts")
    .select("user_id, title")
    .eq("id", input.postId)
    .maybeSingle();
  if (post?.user_id) {
    await supabase.rpc("community_notify", {
      p_user: post.user_id,
      p_kind: "reply_post",
      p_title: `Novo comentário em "${String(post.title).slice(0, 60)}"`,
      p_href: `/comunidade/p/${input.postId}`,
    });
  }
  if (input.parentId) {
    const { data: parent } = await supabase
      .from("community_comments")
      .select("user_id")
      .eq("id", input.parentId)
      .maybeSingle();
    if (parent?.user_id) {
      await supabase.rpc("community_notify", {
        p_user: parent.user_id,
        p_kind: "reply_comment",
        p_title: "Responderam seu comentário",
        p_href: `/comunidade/p/${input.postId}`,
      });
    }
  }

  revalidatePath(`/comunidade/p/${input.postId}`);
  return { ok: true as const, pendingReview: mod.status === "revisao" };
}

export async function updateComment(id: string, content: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("community_comments")
    .update({ content: content.trim().slice(0, 4000), edited: true })
    .eq("id", id)
    .eq("user_id", user.id);
  return { ok: true as const };
}

export async function deleteComment(id: string, postId: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase.from("community_comments").delete().eq("id", id);
  void user;
  revalidatePath(`/comunidade/p/${postId}`);
  return { ok: true as const };
}

export async function reportContent(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase.from("community_reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    detail: input.detail?.slice(0, 500) ?? null,
  });
  return { ok: true as const };
}

export async function markNotificationsRead() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("community_notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/comunidade/notificacoes");
  return { ok: true as const };
}
