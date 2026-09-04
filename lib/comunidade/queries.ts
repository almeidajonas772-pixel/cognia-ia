import { createClient } from "@/lib/supabase/server";
import { FAVORITE_POST_TYPE } from "@/lib/comunidade/types";
import type {
  Attachment,
  Author,
  Comment,
  Group,
  Notification,
  Post,
  PostKind,
  SourceRef,
} from "@/lib/comunidade/types";

type Raw = Record<string, unknown>;

async function authorsById(
  userIds: string[]
): Promise<Map<string, Author>> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return new Map();
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url")
    .in("id", ids);
  return new Map(
    (data ?? []).map((u) => [
      u.id,
      {
        id: u.id,
        name: u.full_name || (u.email ? u.email.split("@")[0] : "Estudante"),
        avatar_url: u.avatar_url,
      },
    ])
  );
}

const FALLBACK_AUTHOR = (id: string): Author => ({
  id,
  name: "Estudante",
  avatar_url: null,
});

export async function listGroups(): Promise<Group[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_groups")
    .select(
      "id, slug, name, description, image_url, category, visibility, rules, official, member_count"
    )
    .order("official", { ascending: false })
    .order("member_count", { ascending: false });
  return (data ?? []) as Group[];
}

export async function getMyGroupIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_group_members")
    .select("group_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((m) => m.group_id));
}

export async function getGroupBySlug(
  slug: string,
  userId: string
): Promise<(Group & { isMember: boolean; myRole: string | null }) | null> {
  const supabase = createClient();
  const { data: group } = await supabase
    .from("community_groups")
    .select(
      "id, slug, name, description, image_url, category, visibility, rules, official, member_count"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!group) return null;

  const { data: membership } = await supabase
    .from("community_group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    ...(group as Group),
    isMember: !!membership,
    myRole: membership?.role ?? null,
  };
}

function hydratePost(
  row: Raw,
  groups: Map<string, { slug: string; name: string }>,
  authors: Map<string, Author>,
  liked: Set<string>,
  saved: Set<string>
): Post {
  const g = groups.get(String(row.group_id));
  return {
    id: String(row.id),
    group_id: String(row.group_id),
    group_slug: g?.slug ?? "",
    group_name: g?.name ?? "Grupo",
    kind: row.kind as Post["kind"],
    title: String(row.title),
    content: String(row.content),
    attachments: (row.attachments as Attachment[]) ?? [],
    source_ref: (row.source_ref as SourceRef) ?? null,
    official: Boolean(row.official),
    pinned: Boolean(row.pinned),
    moderation: row.moderation as Post["moderation"],
    like_count: Number(row.like_count) || 0,
    comment_count: Number(row.comment_count) || 0,
    created_at: String(row.created_at),
    author:
      authors.get(String(row.user_id)) ?? FALLBACK_AUTHOR(String(row.user_id)),
    liked: liked.has(String(row.id)),
    saved: saved.has(String(row.id)),
  };
}

const POST_COLS =
  "id, group_id, user_id, kind, title, content, attachments, source_ref, official, pinned, moderation, like_count, comment_count, created_at";

async function decorate(
  userId: string,
  rows: Raw[]
): Promise<Post[]> {
  if (rows.length === 0) return [];
  const supabase = createClient();
  const groupIds = [...new Set(rows.map((r) => String(r.group_id)))];
  const postIds = rows.map((r) => String(r.id));

  const [{ data: gs }, authors, { data: likes }, { data: favs }] =
    await Promise.all([
      supabase.from("community_groups").select("id, slug, name").in("id", groupIds),
      authorsById(rows.map((r) => String(r.user_id))),
      supabase
        .from("community_post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds),
      supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", FAVORITE_POST_TYPE)
        .in("item_id", postIds),
    ]);

  const groups = new Map((gs ?? []).map((g) => [g.id, { slug: g.slug, name: g.name }]));
  const liked = new Set((likes ?? []).map((l) => l.post_id));
  const saved = new Set((favs ?? []).map((f) => f.item_id));
  return rows.map((r) => hydratePost(r, groups, authors, liked, saved));
}

export async function getGroupPosts(
  groupId: string,
  userId: string,
  opts: { sort?: "recentes" | "curtidos" | "comentados"; kind?: string; q?: string } = {}
): Promise<Post[]> {
  const supabase = createClient();
  let query = supabase
    .from("community_group_posts")
    .select(POST_COLS)
    .eq("group_id", groupId)
    .eq("moderation", "aprovado");

  if (opts.kind) query = query.eq("kind", opts.kind as PostKind);
  if (opts.q && opts.q.trim().length >= 2) {
    const term = `%${opts.q.trim()}%`;
    query = query.or(`title.ilike.${term},content.ilike.${term}`);
  }

  const order =
    opts.sort === "curtidos"
      ? "like_count"
      : opts.sort === "comentados"
        ? "comment_count"
        : "created_at";

  const { data } = await query
    .order("pinned", { ascending: false })
    .order(order, { ascending: false })
    .limit(50);

  return decorate(userId, (data ?? []) as unknown as Raw[]);
}

export async function getUserFeed(
  userId: string,
  limit = 20
): Promise<Post[]> {
  const supabase = createClient();
  const ids = [...(await getMyGroupIds(userId))];
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("community_group_posts")
    .select(POST_COLS)
    .in("group_id", ids)
    .eq("moderation", "aprovado")
    .order("created_at", { ascending: false })
    .limit(limit);
  return decorate(userId, (data ?? []) as unknown as Raw[]);
}

export async function getPost(
  userId: string,
  id: string
): Promise<Post | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_group_posts")
    .select(POST_COLS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [post] = await decorate(userId, [data as unknown as Raw]);
  return post ?? null;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_comments")
    .select("id, post_id, parent_id, user_id, content, edited, created_at, moderation")
    .eq("post_id", postId)
    .eq("moderation", "aprovado")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Raw[];
  const authors = await authorsById(rows.map((r) => String(r.user_id)));

  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  for (const r of rows) {
    const c: Comment = {
      id: String(r.id),
      post_id: String(r.post_id),
      parent_id: r.parent_id ? String(r.parent_id) : null,
      content: String(r.content),
      edited: Boolean(r.edited),
      created_at: String(r.created_at),
      author:
        authors.get(String(r.user_id)) ?? FALLBACK_AUTHOR(String(r.user_id)),
      replies: [],
    };
    map.set(c.id, c);
  }
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export async function getNotifications(
  userId: string,
  limit = 30
): Promise<Notification[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_notifications")
    .select("id, kind, title, href, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("community_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

// ── Admin (spec §11) — RLS já restringe estas leituras a administradores ────
export async function getPendingPosts() {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_group_posts")
    .select("id, title, content, moderation_note")
    .eq("moderation", "revisao")
    .order("created_at", { ascending: true })
    .limit(50);
  return (data ?? []) as {
    id: string;
    title: string;
    content: string;
    moderation_note: string | null;
  }[];
}

export async function getOpenReports() {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_reports")
    .select("id, target_type, target_id, reason, detail, created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as {
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    detail: string | null;
    created_at: string;
  }[];
}

export async function getPendingSubmissions() {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_library_submissions")
    .select("id, title, content, suggested_subject, created_at")
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .limit(50);
  return (data ?? []) as {
    id: string;
    title: string;
    content: string;
    suggested_subject: string | null;
    created_at: string;
  }[];
}
