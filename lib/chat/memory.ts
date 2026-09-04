import { createClient } from "@/lib/supabase/server";
import {
  computeSubjectMastery,
  getProgressCore,
} from "@/lib/progresso/queries";
import type { MemoryContext } from "@/lib/ai/prompts";
import type { ContentBrief } from "@/lib/biblioteca/queries";
import type { ChatDepth } from "@/lib/chat/types";

type MemoryRow = {
  level: ChatDepth | null;
  learning_style: string | null;
  subjects: Record<string, { seen: number; last_at: string }>;
  difficulties: string[];
  notes: string | null;
  evolved_summary: string | null;
  strengths: string[];
  weaknesses: string[];
};

/** Carrega a memória do aluno no formato que o prompt consome. */
export async function loadMemoryContext(
  userId: string
): Promise<MemoryContext | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_user_memory")
    .select(
      "level, learning_style, subjects, difficulties, notes, evolved_summary, strengths, weaknesses"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const row = data as MemoryRow;
  const subjects = Object.entries(row.subjects ?? {})
    .sort((a, b) => (b[1]?.seen ?? 0) - (a[1]?.seen ?? 0))
    .slice(0, 8)
    .map(([slug]) => slug);

  return {
    level: row.level,
    learningStyle: row.learning_style,
    subjects,
    difficulties: (row.difficulties ?? []).slice(0, 8),
    notes: row.notes,
    evolvedSummary: row.evolved_summary ?? null,
    strengths: (row.strengths ?? []).slice(0, 8),
    weaknesses: (row.weaknesses ?? []).slice(0, 8),
  };
}

/**
 * Atualização heurística da memória após um turno (sem custo de IA).
 * - Detecta matérias mencionadas pelo texto e incrementa contadores.
 * - Refresca `notes` com os pontos fracos/fortes vindos do progresso (Fase 5),
 *   para o chat reforçar o que está fraco e não repetir o dominado (spec §5).
 * Roda depois da resposta, sem bloquear o streaming.
 */
export async function updateMemoryHeuristic(
  userId: string,
  input: { userText: string; library: ContentBrief[] }
) {
  const supabase = createClient();
  const text = input.userText.toLowerCase();

  const hits = new Set<string>();
  for (const c of input.library) {
    const name = c.subjectName.toLowerCase();
    if (name.length > 3 && text.includes(name)) hits.add(c.subjectSlug);
    const words = c.title.toLowerCase().split(/\W+/).filter((w) => w.length > 5);
    if (words.some((w) => text.includes(w))) hits.add(c.subjectSlug);
  }

  const [{ data }, core] = await Promise.all([
    supabase
      .from("chat_user_memory")
      .select("subjects")
      .eq("user_id", userId)
      .maybeSingle(),
    getProgressCore(userId).catch(() => null),
  ]);

  const subjects: Record<string, { seen: number; last_at: string }> =
    (data?.subjects as MemoryRow["subjects"]) ?? {};
  const now = new Date().toISOString();
  for (const slug of hits) {
    subjects[slug] = { seen: (subjects[slug]?.seen ?? 0) + 1, last_at: now };
  }

  let notes: string | undefined;
  if (core) {
    const mastery = computeSubjectMastery(core).filter((s) => s.done > 0);
    const weak = [...mastery]
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 2)
      .map((s) => `${s.name} (${s.mastery}%)`);
    const strong = mastery
      .filter((s) => s.mastery >= 75)
      .slice(0, 2)
      .map((s) => s.name);
    const parts: string[] = [];
    if (weak.length) parts.push(`reforçar: ${weak.join(", ")}`);
    if (strong.length) parts.push(`já domina: ${strong.join(", ")}`);
    if (parts.length) notes = parts.join(" · ");
  }

  if (hits.size === 0 && !notes) return;

  await supabase
    .from("chat_user_memory")
    .upsert(
      { user_id: userId, subjects, ...(notes ? { notes } : {}) },
      { onConflict: "user_id" }
    );
}
