import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityItem,
  ActivityKind,
  DayPoint,
  DifficultyLevel,
  SubjectMastery,
} from "@/lib/progresso/types";

type ContentRow = {
  id: string;
  subject_id: string;
  slug: string;
  title: string;
  recurrence: string;
};
type SubjectRow = {
  id: string;
  slug: string;
  name: string;
  area: string;
  position: number;
};

export type ProgressCore = {
  subjects: SubjectRow[];
  contents: (ContentRow & { subjectSlug: string })[];
  completedKeys: Set<string>; // `${subjectSlug}/${contentSlug}`
  completedAt: Map<string, string>;
  viewed: Map<string, { last: string; count: number }>; // content.id -> ...
  difficulty: Map<string, DifficultyLevel>; // content.id -> level
};

/** Uma leitura só do estado bruto de progresso do usuário (deduplicada por request). */
export const getProgressCore = cache(async function getProgressCore(
  userId: string
): Promise<ProgressCore> {
  const supabase = createClient();
  const [
    { data: subjects },
    { data: contents },
    { data: progress },
    { data: history },
    { data: diff },
  ] = await Promise.all([
    supabase
      .from("library_subjects")
      .select("id, slug, name, area, position")
      .order("position"),
    supabase
      .from("library_contents")
      .select("id, subject_id, slug, title, recurrence"),
    supabase
      .from("progress")
      .select("subject, topic, completed, completed_at")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("library_reading_history")
      .select("content_id, last_viewed_at, view_count")
      .eq("user_id", userId),
    supabase
      .from("content_difficulty")
      .select("content_id, level")
      .eq("user_id", userId),
  ]);

  const subjById = new Map(
    ((subjects ?? []) as SubjectRow[]).map((s) => [s.id, s])
  );
  const enrichedContents = ((contents ?? []) as ContentRow[])
    .map((c) => {
      const s = subjById.get(c.subject_id);
      return s ? { ...c, subjectSlug: s.slug } : null;
    })
    .filter((c): c is ContentRow & { subjectSlug: string } => c !== null);

  const completedKeys = new Set<string>();
  const completedAt = new Map<string, string>();
  for (const p of progress ?? []) {
    const key = `${p.subject}/${p.topic}`;
    completedKeys.add(key);
    if (p.completed_at) completedAt.set(key, p.completed_at);
  }

  const viewed = new Map<string, { last: string; count: number }>();
  for (const h of history ?? []) {
    viewed.set(h.content_id, {
      last: h.last_viewed_at,
      count: h.view_count ?? 1,
    });
  }

  const difficulty = new Map<string, DifficultyLevel>();
  for (const d of diff ?? []) {
    difficulty.set(d.content_id, d.level as DifficultyLevel);
  }

  return {
    subjects: (subjects ?? []) as SubjectRow[],
    contents: enrichedContents,
    completedKeys,
    completedAt,
    viewed,
    difficulty,
  };
});

const DAY = 86_400_000;

export function computeSubjectMastery(core: ProgressCore): SubjectMastery[] {
  return core.subjects
    .map((s) => {
      const items = core.contents.filter((c) => c.subject_id === s.id);
      const total = items.length;
      const doneItems = items.filter((c) =>
        core.completedKeys.has(`${s.slug}/${c.slug}`)
      );
      const done = doneItems.length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const hard = doneItems.filter(
        (c) => core.difficulty.get(c.id) === "dificil"
      ).length;
      const hardRatio = done ? hard / done : 0;

      const staleCount = doneItems.filter((c) => {
        const v = core.viewed.get(c.id);
        return !v || Date.now() - new Date(v.last).getTime() > 21 * DAY;
      }).length;
      const staleRatio = done ? staleCount / done : 0;

      const mastery = Math.max(
        0,
        Math.round(pct * (1 - hardRatio * 0.35 - staleRatio * 0.15))
      );

      let lastActivityAt: string | null = null;
      for (const c of items) {
        const v = core.viewed.get(c.id);
        if (v && (!lastActivityAt || v.last > lastActivityAt))
          lastActivityAt = v.last;
      }

      return {
        slug: s.slug,
        name: s.name,
        area: s.area,
        total,
        done,
        pct,
        mastery,
        lastActivityAt,
      };
    })
    .filter((s) => s.total > 0);
}

export function computeOverall(core: ProgressCore) {
  const total = core.contents.length;
  const done = core.contents.filter((c) =>
    core.completedKeys.has(`${c.subjectSlug}/${c.slug}`)
  ).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export type WeakSpots = {
  weakSubjects: SubjectMastery[];
  staleContents: { title: string; href: string; last: string }[];
  hardContents: { title: string; href: string }[];
  untouchedSubjects: SubjectMastery[];
};

export function computeWeakSpots(core: ProgressCore): WeakSpots {
  const mastery = computeSubjectMastery(core);

  const weakSubjects = [...mastery]
    .filter((s) => s.done > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const untouchedSubjects = mastery
    .filter((s) => s.done === 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const staleContents = core.contents
    .filter((c) => {
      if (!core.completedKeys.has(`${c.subjectSlug}/${c.slug}`)) return false;
      const v = core.viewed.get(c.id);
      return v && Date.now() - new Date(v.last).getTime() > 21 * DAY;
    })
    .slice(0, 5)
    .map((c) => ({
      title: c.title,
      href: `/biblioteca/${c.subjectSlug}/${c.slug}`,
      last: core.viewed.get(c.id)!.last,
    }));

  const hardContents = core.contents
    .filter((c) => core.difficulty.get(c.id) === "dificil")
    .slice(0, 5)
    .map((c) => ({
      title: c.title,
      href: `/biblioteca/${c.subjectSlug}/${c.slug}`,
    }));

  return { weakSubjects, untouchedSubjects, staleContents, hardContents };
}

/** Série diária de minutos/atividades para os gráficos (spec §1). */
export async function getDailySeries(
  userId: string,
  days = 30
): Promise<DayPoint[]> {
  const supabase = createClient();
  const from = new Date(Date.now() - (days - 1) * DAY)
    .toISOString()
    .slice(0, 10);
  const { data } = await supabase
    .from("study_daily")
    .select("day, minutes, activities")
    .eq("user_id", userId)
    .gte("day", from)
    .order("day");

  const byDay = new Map(
    (data ?? []).map((d) => [
      d.day,
      { minutes: d.minutes, activities: d.activities },
    ])
  );
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    const hit = byDay.get(day);
    out.push({ day, minutes: hit?.minutes ?? 0, activities: hit?.activities ?? 0 });
  }
  return out;
}

export async function getStudyStats(userId: string) {
  const supabase = createClient();
  const series = await getDailySeries(userId, 30);
  const minutes30d = series.reduce((a, d) => a + d.minutes, 0);
  const minutes7d = series.slice(-7).reduce((a, d) => a + d.minutes, 0);
  const minutesToday = series[series.length - 1]?.minutes ?? 0;

  // streak: dias consecutivos com atividade até hoje (ou ontem)
  let streak = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].activities > 0 || series[i].minutes > 0) streak++;
    else if (i === series.length - 1) continue; // hoje ainda pode começar
    else break;
  }

  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const { count: sessions30d } = await supabase
    .from("study_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", since);

  return {
    minutesToday,
    minutes7d,
    minutes30d,
    streak,
    sessions30d: sessions30d ?? 0,
    series,
  };
}

function activityHref(a: ActivityItem): string {
  if (a.meta && typeof a.meta.href === "string") return a.meta.href;
  if (a.kind === "chat") return a.ref_id ? `/chat/${a.ref_id}` : "/chat";
  if (a.kind === "questions") return "/chat";
  if (a.kind === "essay") return a.ref_id ? `/redacao/${a.ref_id}` : "/redacao";
  return "/dashboard";
}

export async function getTimeline(
  userId: string,
  opts: {
    items?: number;
    days?: number;
    subject?: string;
    kind?: ActivityKind;
  } = {}
): Promise<(ActivityItem & { href: string })[]> {
  const supabase = createClient();
  let q = supabase
    .from("activity_log")
    .select("id, kind, subject_slug, ref_id, ref_label, meta, created_at")
    .eq("user_id", userId);

  if (opts.days) {
    q = q.gte(
      "created_at",
      new Date(Date.now() - opts.days * DAY).toISOString()
    );
  }
  if (opts.subject) q = q.eq("subject_slug", opts.subject);
  if (opts.kind) q = q.eq("kind", opts.kind);

  const { data } = await q
    .order("created_at", { ascending: false })
    .limit(opts.items ?? 40);

  return ((data ?? []) as unknown as ActivityItem[]).map((a) => ({
    ...a,
    href: activityHref(a),
  }));
}

export async function getActivityCounts(userId: string) {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const { data } = await supabase
    .from("activity_log")
    .select("kind")
    .eq("user_id", userId)
    .gte("created_at", since);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  return counts;
}
