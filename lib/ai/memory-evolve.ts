import { createServiceClient } from "@/lib/supabase/service";
import { getRoutedChatProvider } from "@/lib/ai";
import { logEvent, logError } from "@/lib/observability/log";

/**
 * Fase 15 — Memória evolutiva.
 *
 * Destila a atividade recente do aluno (perguntas no chat, erros de redação,
 * conteúdos marcados como difíceis, objetivo do onboarding) num perfil
 * atualizado: resumo, pontos fortes, pontos fracos e estilo preferido. Roda
 * como job da fila (Fase 10). Com IA quando há chave; sem chave, um resumo
 * determinístico dos mesmos dados.
 */

type Gathered = {
  goal: string | null;
  level: string | null;
  focus: string[];
  difficulties: string[];
  questions: string[];
  essayErrors: { label: string; occ: number }[];
  hardContents: string[];
  topSubjects: { slug: string; n: number }[];
  completedSubjects: string[];
};

async function gather(
  db: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<Gathered> {
  const [mem, onb, msgs, errs, hard, acts] = await Promise.all([
    db
      .from("chat_user_memory")
      .select("difficulties")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("user_onboarding")
      .select("goal, level, focus_areas")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("chat_messages")
      .select("content, role, created_at")
      .eq("user_id", userId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("essay_error_bank")
      .select("label, occurrences")
      .eq("user_id", userId)
      .order("occurrences", { ascending: false })
      .limit(6),
    db
      .from("content_difficulty")
      .select("content_id, level")
      .eq("user_id", userId)
      .eq("level", "dificil")
      .limit(20),
    db
      .from("activity_log")
      .select("subject_slug, kind")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const subjCount = new Map<string, number>();
  const completed = new Set<string>();
  for (const a of acts.data ?? []) {
    if (a.subject_slug) subjCount.set(a.subject_slug, (subjCount.get(a.subject_slug) ?? 0) + 1);
    if (a.kind === "content_completed" && a.subject_slug) completed.add(a.subject_slug);
  }

  let hardContents: string[] = [];
  const hardIds = (hard.data ?? []).map((h) => h.content_id);
  if (hardIds.length) {
    const { data: titles } = await db
      .from("library_contents")
      .select("title")
      .in("id", hardIds);
    hardContents = (titles ?? []).map((t) => t.title).slice(0, 6);
  }

  return {
    goal: onb.data?.goal ?? null,
    level: onb.data?.level ?? null,
    focus: onb.data?.focus_areas ?? [],
    difficulties: mem.data?.difficulties ?? [],
    questions: (msgs.data ?? [])
      .map((m) => (m.content ?? "").replace(/\s+/g, " ").trim().slice(0, 160))
      .filter(Boolean)
      .slice(0, 15),
    essayErrors: (errs.data ?? []).map((e) => ({
      label: e.label,
      occ: e.occurrences,
    })),
    hardContents,
    topSubjects: [...subjCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, n]) => ({ slug, n })),
    completedSubjects: [...completed],
  };
}

type Profile = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  style: string;
};

function deterministic(g: Gathered): Profile {
  const weaknesses = [
    ...g.essayErrors.map((e) => e.label),
    ...g.hardContents.map((t) => `dificuldade em "${t}"`),
    ...g.difficulties,
  ]
    .filter(Boolean)
    .slice(0, 8);

  const strengths = g.completedSubjects
    .map((s) => `bom ritmo em ${s}`)
    .slice(0, 5);

  const goalTxt =
    g.goal === "enem"
      ? "foco no ENEM"
      : g.goal === "vestibular"
        ? "foco em vestibular específico"
        : g.goal === "reforco"
          ? "reforço escolar"
          : "objetivo geral de estudos";

  const summary =
    `Aluno com ${goalTxt}` +
    (g.level ? `, nível autodeclarado ${g.level}` : "") +
    (g.topSubjects.length
      ? `. Estuda mais: ${g.topSubjects.map((s) => s.slug).join(", ")}`
      : "") +
    (weaknesses.length ? `. Precisa reforçar: ${weaknesses.slice(0, 4).join("; ")}` : "") +
    ".";

  return {
    summary,
    strengths,
    weaknesses,
    style: g.level === "basico" ? "explicações do zero, com analogias" : "",
  };
}

function extractJson(raw: string): Record<string, unknown> | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const strArr = (v: unknown, max = 8): string[] =>
  Array.isArray(v)
    ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max)
    : [];

export async function evolveMemory(
  userId: string,
  db: ReturnType<typeof createServiceClient> = createServiceClient()
): Promise<{ ok: boolean; version?: number; mode: "ai" | "deterministic" }> {
  try {
    const g = await gather(db, userId);
    const fallback = deterministic(g);
    let profile = fallback;
    let mode: "ai" | "deterministic" = "deterministic";

    const { provider } = await getRoutedChatProvider({
      task: "memory",
      tier: "free",
      userId,
    });

    if (provider.live) {
      const system =
        "Você mantém a MEMÓRIA EVOLUTIVA de um aluno de ENEM/vestibular. " +
        "A partir dos dados, produza um perfil enxuto e acionável. " +
        'Responda APENAS com JSON: {"summary": "2-4 frases", "strengths": ["..."], ' +
        '"weaknesses": ["..."], "style": "como o aluno prefere aprender (1 frase)"}. ' +
        "Sem inventar; se faltar dado, seja conservador.";
      const user = JSON.stringify(g);
      try {
        // provider já é resiliente e registra a chamada em ai_calls (Fase 10).
        const raw = await provider.generateText({
          system,
          messages: [{ role: "user", content: user }],
          temperature: 0.2,
        });
        const j = extractJson(raw);
        if (j) {
          profile = {
            summary: String(j.summary ?? fallback.summary).slice(0, 2000),
            strengths: strArr(j.strengths).length ? strArr(j.strengths) : fallback.strengths,
            weaknesses: strArr(j.weaknesses).length ? strArr(j.weaknesses) : fallback.weaknesses,
            style: typeof j.style === "string" ? j.style.slice(0, 200) : fallback.style,
          };
          mode = "ai";
        }
      } catch (err) {
        await logError("ai.memoryEvolve", err, { userId, phase: "generate" });
      }
    }

    const payload: Record<string, unknown> = { ...profile, gathered: g, mode };
    const { data: version } = await db.rpc("apply_memory_evolution", {
      p_user: userId,
      p_summary: profile.summary,
      p_strengths: profile.strengths,
      p_weaknesses: profile.weaknesses,
      p_style: profile.style,
      p_payload: payload,
    });

    await logEvent({
      source: "ai.memoryEvolve",
      message: `memória evoluída (${mode})`,
      userId,
      meta: { version, mode },
    });
    return { ok: true, version: typeof version === "number" ? version : undefined, mode };
  } catch (err) {
    await logError("ai.memoryEvolve", err, {}, userId);
    return { ok: false, mode: "deterministic" };
  }
}
