import { createClient } from "@/lib/supabase/server";

export type Analytics = {
  views7d: number;
  views30d: number;
  topPages: { path: string; count: number }[];
  topContent: { label: string; count: number }[];
  sources: { source: string; count: number }[];
  avgSessionMin: number;
  retention: number; // % usuários ativos em 2 semanas seguidas
};

const DAY = 86_400_000;

function hostOf(ref: string | null): string {
  if (!ref) return "Direto";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Outro";
  }
}

export async function getAnalytics(): Promise<Analytics> {
  const supabase = createClient();
  const since30 = new Date(Date.now() - 30 * DAY).toISOString();
  const since7 = new Date(Date.now() - 7 * DAY).toISOString();

  const [{ data: views }, { data: reads }, { data: study }, { data: acts }] =
    await Promise.all([
      supabase
        .from("page_views")
        .select("path, referrer, created_at")
        .gte("created_at", since30),
      supabase
        .from("activity_log")
        .select("ref_label")
        .eq("kind", "content_read")
        .gte("created_at", since30),
      supabase
        .from("study_daily")
        .select("minutes")
        .gte("day", since30.slice(0, 10)),
      supabase
        .from("activity_log")
        .select("user_id, created_at")
        .gte("created_at", since30),
    ]);

  const V = views ?? [];
  const views7d = V.filter(
    (v) => new Date(v.created_at).toISOString() >= since7
  ).length;

  const tally = <T,>(rows: T[], key: (r: T) => string, top = 8) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = key(r);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([k, c]) => ({ key: k, count: c }));
  };

  const topPages = tally(V, (v) => v.path).map((x) => ({
    path: x.key,
    count: x.count,
  }));
  const sources = tally(V, (v) => hostOf(v.referrer)).map((x) => ({
    source: x.key,
    count: x.count,
  }));
  const topContent = tally(reads ?? [], (r) => r.ref_label ?? "").map((x) => ({
    label: x.key,
    count: x.count,
  }));

  const minutes = (study ?? []).map((s) => s.minutes ?? 0);
  const avgSessionMin = minutes.length
    ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
    : 0;

  // retenção: usuários com atividade nas semanas -1 e -2
  const wk = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / (7 * DAY));
  const byWeek = new Map<number, Set<string>>();
  for (const a of acts ?? []) {
    const w = wk(String(a.created_at));
    if (!byWeek.has(w)) byWeek.set(w, new Set());
    byWeek.get(w)!.add(a.user_id);
  }
  const w0 = byWeek.get(0) ?? new Set();
  const w1 = byWeek.get(1) ?? new Set();
  const retained = [...w1].filter((u) => w0.has(u)).length;
  const retention = w1.size ? Math.round((retained / w1.size) * 100) : 0;

  return {
    views7d,
    views30d: V.length,
    topPages,
    topContent,
    sources,
    avgSessionMin,
    retention,
  };
}
