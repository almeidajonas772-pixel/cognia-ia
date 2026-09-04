import { createClient } from "@/lib/supabase/server";
import { getBanca } from "@/lib/redacao/bancas";
import type { CompetencyScore } from "@/lib/redacao/types";

export type EssayStats = {
  totalCorrected: number;
  averagePct: number;
  bestPct: number;
  evolution: { date: string; pct: number; label: string }[];
  perCompetency: { name: string; avgPct: number; count: number }[];
  strongest: string | null;
  weakest: string | null;
  topError: { label: string; occurrences: number } | null;
};

type Row = {
  banca: string;
  grade: number | null;
  grade_max: number | null;
  competencies: unknown;
  corrected_at: string | null;
  created_at: string;
};

export async function getEssayStats(userId: string): Promise<EssayStats> {
  const supabase = createClient();
  const [{ data: rows }, { data: errors }] = await Promise.all([
    supabase
      .from("essay_submissions")
      .select("banca, grade, grade_max, competencies, corrected_at, created_at")
      .eq("user_id", userId)
      .eq("status", "corrigida")
      .order("created_at", { ascending: true }),
    supabase
      .from("essay_error_bank")
      .select("label, occurrences")
      .eq("user_id", userId)
      .order("occurrences", { ascending: false })
      .limit(1),
  ]);

  const corrected = ((rows ?? []) as Row[]).filter(
    (r) => r.grade != null && r.grade_max
  );

  const pcts = corrected.map((r) => (r.grade! / r.grade_max!) * 100);
  const averagePct = pcts.length
    ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    : 0;
  const bestPct = pcts.length ? Math.round(Math.max(...pcts)) : 0;

  const evolution = corrected.map((r, i) => ({
    date: r.corrected_at ?? r.created_at,
    pct: Math.round((r.grade! / r.grade_max!) * 100),
    label: `#${i + 1}`,
  }));

  // média por competência (só ENEM, que tem competências fixas comparáveis)
  const enemComps = getBanca("enem")!.competencies;
  const agg = new Map<string, { sum: number; n: number }>();
  for (const r of corrected) {
    if (r.banca !== "enem") continue;
    const comps = (r.competencies as CompetencyScore[] | null) ?? [];
    for (const c of comps) {
      if (!c.max) continue;
      const cur = agg.get(c.name) ?? { sum: 0, n: 0 };
      cur.sum += (c.score / c.max) * 100;
      cur.n += 1;
      agg.set(c.name, cur);
    }
  }
  const perCompetency = enemComps
    .map((c) => {
      const a = agg.get(c.name);
      return {
        name: c.name,
        avgPct: a ? Math.round(a.sum / a.n) : 0,
        count: a?.n ?? 0,
      };
    })
    .filter((c) => c.count > 0);

  const ranked = [...perCompetency].sort((a, b) => b.avgPct - a.avgPct);

  return {
    totalCorrected: corrected.length,
    averagePct,
    bestPct,
    evolution,
    perCompetency,
    strongest: ranked[0]?.name ?? null,
    weakest: ranked[ranked.length - 1]?.name ?? null,
    topError: errors?.[0]
      ? { label: errors[0].label, occurrences: errors[0].occurrences }
      : null,
  };
}
