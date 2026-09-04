import { createClient } from "@/lib/supabase/server";
import { getChatProvider } from "@/lib/ai";
import { makeOpenAiProvider } from "@/lib/ai/providers/openai";
import { routeModel, estimateComplexity } from "@/lib/ai/routing";
import { logError } from "@/lib/observability/log";
import { recordAiCall, approxTokens } from "@/lib/observability/ai-usage";
import { logActivity } from "@/lib/progresso/activity";
import { getBanca } from "@/lib/redacao/bancas";
import { buildCorrectionPrompt } from "@/lib/redacao/prompts";
import { IMPROVEMENT_AREAS } from "@/lib/redacao/types";
import type {
  CorrectionResult,
  Improvement,
  Priority,
} from "@/lib/redacao/types";

const PRIORITIES: Priority[] = ["critico", "importante", "medio", "bom"];
const asPriority = (v: unknown): Priority =>
  PRIORITIES.includes(v as Priority) ? (v as Priority) : "medio";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "erro";

function extractJson(raw: string): Record<string, unknown> | null {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try {
    return JSON.parse(t.slice(a, b + 1));
  } catch {
    return null;
  }
}

/** Garante as 13 áreas fixas do feedback (spec §12). */
function normalizeImprovements(raw: unknown): Improvement[] {
  const arr = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const byArea = new Map(
    arr
      .filter((i) => typeof i?.area === "string")
      .map((i) => [String(i.area).trim().toLowerCase(), i])
  );
  return IMPROVEMENT_AREAS.map((area) => {
    const hit = byArea.get(area.toLowerCase());
    return {
      area,
      priority: asPriority(hit?.priority),
      note: typeof hit?.note === "string" ? hit.note : "Sem observações.",
    };
  });
}

function parseResult(
  json: Record<string, unknown>,
  scaleMax: number
): CorrectionResult {
  if (json.notAnEssay === true) {
    return {
      notAnEssay: true,
      grade: 0,
      gradeMax: scaleMax,
      competencies: [],
      errors: [],
      improvements: [],
      maxScoreGap: { missing: [], limiting: [], toPerfect: [] },
      summary:
        typeof json.summary === "string"
          ? json.summary
          : "O texto enviado não pôde ser avaliado como redação.",
    };
  }

  const comps = Array.isArray(json.competencies)
    ? (json.competencies as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? slug(String(c.name ?? "criterio"))),
        name: String(c.name ?? "Critério"),
        score: Math.max(0, Number(c.score) || 0),
        max: Math.max(1, Number(c.max) || 0),
        weight: Number(c.weight) || 1,
        comment: String(c.comment ?? ""),
      }))
    : [];
  for (const c of comps) c.score = Math.min(c.score, c.max);

  const errors = Array.isArray(json.errors)
    ? (json.errors as Record<string, unknown>[]).slice(0, 20).map((e) => ({
        excerpt: String(e.excerpt ?? ""),
        explanation: String(e.explanation ?? ""),
        rule: String(e.rule ?? ""),
        correction: String(e.correction ?? ""),
        rewrite: String(e.rewrite ?? ""),
        priority: asPriority(e.priority),
        signature: slug(String(e.signature ?? e.category ?? e.explanation ?? "")),
        category: String(e.category ?? "Geral"),
      }))
    : [];

  let grade = Number(json.grade);
  if (!Number.isFinite(grade)) {
    grade = comps.length
      ? comps.reduce((a, c) => a + c.score, 0)
      : 0;
  }
  grade = Math.max(0, Math.min(grade, scaleMax));

  const gap = (json.maxScoreGap ?? {}) as Record<string, unknown>;
  const strArr = (v: unknown) =>
    Array.isArray(v) ? v.map(String).slice(0, 6) : [];

  return {
    grade: Math.round(grade * 100) / 100,
    gradeMax: scaleMax,
    competencies: comps,
    errors,
    improvements: normalizeImprovements(json.improvements),
    maxScoreGap: {
      missing: strArr(gap.missing),
      limiting: strArr(gap.limiting),
      toPerfect: strArr(gap.toPerfect),
    },
    summary: String(json.summary ?? ""),
  };
}

function demoCorrection(text: string, scaleMax: number, compNames: string[]): CorrectionResult {
  const factor = 0.62;
  const words = text.trim().split(/\s+/).length;
  return {
    grade: Math.round(scaleMax * factor),
    gradeMax: scaleMax,
    competencies: compNames.map((name, i) => ({
      id: `c${i + 1}`,
      name,
      score: Math.round((scaleMax / compNames.length) * (factor + (i % 2 ? 0.05 : -0.05))),
      max: Math.round(scaleMax / compNames.length),
      weight: 1,
      comment:
        "Comentário de exemplo (modo demonstração — conecte OPENAI_API_KEY para a correção real).",
    })),
    errors: [
      {
        excerpt: text.slice(0, 60) || "trecho inicial",
        explanation: "Exemplo de apontamento — a correção real detalha cada desvio.",
        rule: "Critério da banca (exemplo)",
        correction: "versão corrigida (exemplo)",
        rewrite: "sugestão de reescrita (exemplo)",
        priority: "importante",
        signature: "exemplo-modo-demo",
        category: "Geral",
      },
    ],
    improvements: IMPROVEMENT_AREAS.map((area, i) => ({
      area,
      priority: (["critico", "importante", "medio", "bom"] as Priority[])[i % 4],
      note: "Orientação de exemplo (modo demonstração).",
    })),
    maxScoreGap: {
      missing: ["Aprofundar a argumentação", "Fechar melhor a proposta de intervenção"],
      limiting: ["Coesão textual", "Repertório sociocultural"],
      toPerfect: ["Revisar conectivos entre parágrafos", "Detalhar a proposta com agente e meio"],
    },
    summary: `Correção de demonstração (${words} palavras). Conecte uma chave de IA para a correção real.`,
  };
}

/**
 * Executa a correção de uma redação já com transcrição confirmada.
 * Persiste o resultado, alimenta o banco de erros (spec §11) e o histórico (Fase 5).
 *
 * `db` permite injetar um cliente com service role quando rodando a partir do
 * worker de fila (Fase 10), onde não há sessão de usuário para satisfazer o RLS.
 */
export async function runCorrection(
  userId: string,
  essayId: string,
  db?: ReturnType<typeof createClient>
) {
  const supabase = db ?? createClient();

  const { data: essay } = await supabase
    .from("essay_submissions")
    .select(
      "id, title, raw_text, banca, rubric_id, correction_type, detail_level, mode, status"
    )
    .eq("id", essayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!essay) return { ok: false as const, error: "not_found" };
  if (essay.status === "corrigida")
    return { ok: true as const, alreadyDone: true };
  // 'corrigindo' é aceito para permitir retomar uma correção interrompida.
  if (
    essay.status !== "transcricao_confirmada" &&
    essay.status !== "corrigindo"
  )
    return { ok: false as const, error: "invalid_status" };

  const text = (essay.raw_text ?? "").trim();
  if (text.length < 40)
    return { ok: false as const, error: "texto_muito_curto" };

  await supabase
    .from("essay_submissions")
    .update({ status: "corrigindo" })
    .eq("id", essayId);

  // rubrica personalizada?
  let rubric: {
    scaleMax: number;
    criteria: { name: string; weight?: number; max?: number; description?: string }[];
    notes?: string;
  } | null = null;
  if (essay.rubric_id) {
    const { data: r } = await supabase
      .from("essay_rubrics")
      .select("parsed")
      .eq("id", essay.rubric_id)
      .maybeSingle();
    const parsed = r?.parsed as typeof rubric;
    if (parsed?.criteria?.length) rubric = parsed;
  }

  const banca = getBanca(essay.banca) ?? getBanca("enem")!;
  const scaleMax = rubric?.scaleMax || banca.scaleMax;
  const compNames = rubric
    ? rubric.criteria.map((c) => c.name)
    : banca.competencies.map((c) => c.name);

  // Fase 15 — correção sempre no modelo mais capaz (task 'essay').
  const live = !!process.env.OPENAI_API_KEY;
  let provider = getChatProvider();
  if (live) {
    const bancaRigor = (banca.rigor ?? "").length > 200 ? 80 : 50;
    const routed = await routeModel({
      task: "essay",
      tier: "premium",
      complexity: estimateComplexity({ text, depth: "avancado", bancaRigor }),
      live,
    });
    if (routed.provider === "openai") provider = makeOpenAiProvider(routed.model);
  }
  let result: CorrectionResult;

  try {
    if (!provider.live) {
      result = demoCorrection(text, scaleMax, compNames);
    } else {
      const { system, user } = buildCorrectionPrompt({
        text,
        banca,
        type: essay.correction_type,
        detail: essay.detail_level,
        mode: essay.mode,
        rubric,
      });
      const t0 = Date.now();
      const raw = await provider.generateText({
        system,
        messages: [{ role: "user", content: user }],
        temperature: 0.2,
      });
      await recordAiCall({
        provider: provider.id,
        model: provider.id,
        kind: "essay",
        userId,
        tokensIn: approxTokens(system + user),
        tokensOut: approxTokens(raw),
        durationMs: Date.now() - t0,
      });
      const json = extractJson(raw);
      if (!json) throw new Error("parse_failed");
      result = parseResult(json, scaleMax);
    }
  } catch (err) {
    await logError("redacao.correct", err, { essayId }, userId);
    await recordAiCall({ provider: provider.id, model: provider.id, kind: "essay", userId, ok: false });
    await supabase
      .from("essay_submissions")
      .update({ status: "erro", summary: "Falha ao gerar a correção." })
      .eq("id", essayId);
    return { ok: false as const, error: "generation_failed" };
  }

  const finalStatus = result.notAnEssay ? "erro" : "corrigida";

  await supabase
    .from("essay_submissions")
    .update({
      status: finalStatus,
      grade: result.notAnEssay ? null : result.grade,
      grade_max: result.gradeMax,
      competencies: result.competencies,
      errors: result.errors,
      improvements: result.improvements,
      max_score_gap: result.maxScoreGap,
      summary: result.summary,
      model: provider.id,
      corrected_at: new Date().toISOString(),
    })
    .eq("id", essayId);

  if (!result.notAnEssay) {
    // banco de erros recorrentes (spec §11)
    for (const e of result.errors) {
      await supabase.rpc("bump_error_bank", {
        p_user: userId,
        p_signature: e.signature,
        p_label: e.explanation.slice(0, 120) || e.category,
        p_category: e.category,
      });
    }
    await logActivity({
      userId,
      kind: "essay",
      refId: essayId,
      refLabel: essay.title,
      meta: {
        href: `/redacao/${essayId}`,
        grade: result.grade,
        gradeMax: result.gradeMax,
        banca: essay.banca,
      },
    });
  }

  return { ok: true as const, notAnEssay: result.notAnEssay ?? false };
}
