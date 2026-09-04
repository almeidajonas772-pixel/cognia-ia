import { createClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import { FAVORITE_TYPE } from "@/lib/biblioteca/types";
import type {
  Content,
  LibraryUserState,
  Subject,
  Topic,
} from "@/lib/biblioteca/types";

const SUBJECT_COLS = "id, area, slug, name, description, icon, position";
const CONTENT_COLS =
  "id, topic_id, subject_id, slug, title, summary_short, recurrence, reading_minutes, position";

export type TopicWithContents = Topic & { contents: Content[] };
export type SubjectDetail = Subject & { topics: TopicWithContents[] };
export type SubjectWithCount = Subject & { totalContents: number };
export type SearchHit = Content & { subject_slug: string; subject_name: string };

/** Todas as matérias + nº de conteúdos publicados de cada uma. */
export async function getSubjectsWithCounts(): Promise<SubjectWithCount[]> {
  // Catálogo é global (não varia por usuário) — cache curto, invalidado pelas
  // mutações do admin via bust("biblioteca:") (Fase 10).
  return cached("biblioteca:subjects-with-counts", 300, async () => {
    const supabase = createClient();
    const [{ data: subjects }, { data: contents }] = await Promise.all([
      supabase.from("library_subjects").select(SUBJECT_COLS).order("position"),
      supabase.from("library_contents").select("subject_id"),
    ]);

    const counts = new Map<string, number>();
    for (const row of contents ?? []) {
      counts.set(row.subject_id, (counts.get(row.subject_id) ?? 0) + 1);
    }

    return (subjects ?? []).map((s) => ({
      ...(s as Subject),
      totalContents: counts.get(s.id) ?? 0,
    }));
  });
}

/** Uma matéria com seus temas e conteúdos aninhados. */
export async function getSubjectBySlug(
  slug: string
): Promise<SubjectDetail | null> {
  const supabase = createClient();
  const { data: subject } = await supabase
    .from("library_subjects")
    .select(SUBJECT_COLS)
    .eq("slug", slug)
    .single();
  if (!subject) return null;

  const [{ data: topics }, { data: contents }] = await Promise.all([
    supabase
      .from("library_topics")
      .select("id, subject_id, slug, name, position")
      .eq("subject_id", subject.id)
      .order("position"),
    supabase
      .from("library_contents")
      .select(CONTENT_COLS)
      .eq("subject_id", subject.id)
      .order("position"),
  ]);

  const byTopic = new Map<string, Content[]>();
  for (const c of (contents ?? []) as Content[]) {
    const list = byTopic.get(c.topic_id) ?? [];
    list.push(c);
    byTopic.set(c.topic_id, list);
  }

  return {
    ...(subject as Subject),
    topics: ((topics ?? []) as Topic[]).map((t) => ({
      ...t,
      contents: byTopic.get(t.id) ?? [],
    })),
  };
}

export type ContentView = {
  content: Content;
  subject: Subject;
  topic: Pick<Topic, "id" | "slug" | "name">;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

/** Um conteúdo pela rota /biblioteca/[subject]/[content], com navegação. */
export async function getContentView(
  subjectSlug: string,
  contentSlug: string
): Promise<ContentView | null> {
  const supabase = createClient();

  const { data: subject } = await supabase
    .from("library_subjects")
    .select(SUBJECT_COLS)
    .eq("slug", subjectSlug)
    .single();
  if (!subject) return null;

  const { data: content } = await supabase
    .from("library_contents")
    .select(CONTENT_COLS)
    .eq("subject_id", subject.id)
    .eq("slug", contentSlug)
    .single();
  if (!content) return null;

  const [{ data: topic }, { data: siblings }] = await Promise.all([
    supabase
      .from("library_topics")
      .select("id, slug, name")
      .eq("id", content.topic_id)
      .single(),
    supabase
      .from("library_contents")
      .select("slug, title, position")
      .eq("subject_id", subject.id)
      .order("position"),
  ]);

  const list = siblings ?? [];
  const i = list.findIndex((c) => c.slug === contentSlug);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;

  return {
    content: content as Content,
    subject: subject as Subject,
    topic: topic ?? { id: content.topic_id, slug: "", name: "" },
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}

/**
 * Corpo do RESUMO COMPLETO. Retorna null quando o usuário não é Premium —
 * a RLS `library_premium_read` já bloqueia; aqui é a segunda camada.
 */
export async function getPremiumBody(contentId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("library_content_premium")
    .select("body")
    .eq("content_id", contentId)
    .maybeSingle();
  return data?.body ?? null;
}

export type ContentBrief = {
  title: string;
  slug: string;
  subjectSlug: string;
  subjectName: string;
  recurrence: string;
};

/**
 * Lista enxuta de todos os conteúdos publicados (título + rota).
 * Usada pelo Chat (Fase 4) para recomendar material da Biblioteca.
 */
export async function listContentsBrief(): Promise<ContentBrief[]> {
  const supabase = createClient();
  const [{ data: contents }, subjects] = await Promise.all([
    supabase
      .from("library_contents")
      .select("slug, title, subject_id, recurrence")
      .order("position"),
    loadSubjectsById(),
  ]);

  return ((contents ?? []) as {
    slug: string;
    title: string;
    subject_id: string;
    recurrence: string;
  }[])
    .map((c) => {
      const s = subjects.get(c.subject_id);
      if (!s) return null;
      return {
        title: c.title,
        slug: c.slug,
        subjectSlug: s.slug,
        subjectName: s.name,
        recurrence: c.recurrence,
      };
    })
    .filter((x): x is ContentBrief => x !== null);
}

/** Mapa id -> matéria (para juntar sem depender de embeds do PostgREST). */
async function loadSubjectsById() {
  const supabase = createClient();
  const { data } = await supabase.from("library_subjects").select(SUBJECT_COLS);
  return new Map<string, Subject>(
    ((data ?? []) as Subject[]).map((s) => [s.id, s])
  );
}

/** Busca simples por título (usada em /biblioteca/busca). */
export async function searchContents(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = createClient();

  const [{ data }, subjects] = await Promise.all([
    supabase
      .from("library_contents")
      .select(CONTENT_COLS)
      .ilike("title", `%${q}%`)
      .order("position")
      .limit(30),
    loadSubjectsById(),
  ]);

  return ((data ?? []) as Content[])
    .map((c) => {
      const s = subjects.get(c.subject_id);
      if (!s) return null;
      return { ...c, subject_slug: s.slug, subject_name: s.name };
    })
    .filter((x): x is SearchHit => x !== null);
}

/** Estado do usuário: concluídos, favoritos e última visualização. */
export async function getUserLibraryState(
  userId: string
): Promise<LibraryUserState> {
  const supabase = createClient();
  const [{ data: progress }, { data: favorites }, { data: history }] =
    await Promise.all([
      supabase
        .from("progress")
        .select("subject, topic, completed")
        .eq("user_id", userId)
        .eq("completed", true),
      supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", FAVORITE_TYPE),
      supabase
        .from("library_reading_history")
        .select("content_id, last_viewed_at")
        .eq("user_id", userId),
    ]);

  return {
    completed: new Set(
      (progress ?? []).map((p) => `${p.subject}/${p.topic}`)
    ),
    favorites: new Set((favorites ?? []).map((f) => f.item_id)),
    lastViewed: new Map(
      (history ?? []).map((h) => [h.content_id, h.last_viewed_at])
    ),
  };
}

/** Progresso geral da biblioteca para um usuário. */
export async function getOverallProgress(userId: string) {
  const supabase = createClient();
  const [{ count: total }, { count: done }] = await Promise.all([
    supabase
      .from("library_contents")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true),
  ]);
  const t = total ?? 0;
  const d = Math.min(done ?? 0, t);
  return { total: t, done: d, pct: t ? Math.round((d / t) * 100) : 0 };
}

/** Conteúdos vistos recentemente ("continuar de onde parou"). */
export async function getContinueReading(userId: string, limit = 4) {
  const supabase = createClient();
  const { data: history } = await supabase
    .from("library_reading_history")
    .select("content_id, last_viewed_at")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false })
    .limit(limit);

  if (!history?.length) return [];

  const [{ data: contents }, subjects] = await Promise.all([
    supabase
      .from("library_contents")
      .select(CONTENT_COLS)
      .in(
        "id",
        history.map((h) => h.content_id)
      ),
    loadSubjectsById(),
  ]);

  const order = new Map(history.map((h, idx) => [h.content_id, idx]));
  return ((contents ?? []) as Content[])
    .map((content) => ({
      content,
      subjectSlug: subjects.get(content.subject_id)?.slug ?? "",
    }))
    .filter((x) => x.subjectSlug !== "")
    .sort((a, b) => (order.get(a.content.id) ?? 0) - (order.get(b.content.id) ?? 0));
}
