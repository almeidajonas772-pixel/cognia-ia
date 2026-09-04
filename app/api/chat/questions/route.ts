import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { getChatProvider } from "@/lib/ai";
import { buildQuestionsPrompt } from "@/lib/ai/prompts";
import { checkChatLimit, limitsFor } from "@/lib/chat/limits";
import { logActivity } from "@/lib/progresso/activity";
import type { GeneratedQuestion, Depth } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  tema: string;
  quantidade?: number;
  banca?: string;
  depth?: Depth;
};

function extractJson(raw: string): { questions: GeneratedQuestion[] } | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed.questions)) return null;
    const questions = parsed.questions
      .filter(
        (q: GeneratedQuestion) =>
          q &&
          typeof q.enunciado === "string" &&
          Array.isArray(q.alternativas) &&
          q.alternativas.length >= 2 &&
          typeof q.gabarito === "number"
      )
      .map((q: GeneratedQuestion) => ({
        enunciado: q.enunciado,
        alternativas: q.alternativas.slice(0, 5),
        gabarito: Math.max(0, Math.min(4, q.gabarito)),
        explicacao: q.explicacao ?? "",
      }));
    return questions.length ? { questions } : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "questions", RATE_RULES.aiHeavy, user.id);
  if (limited) return limited;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.tema?.trim()) {
    return NextResponse.json({ error: "tema_required" }, { status: 400 });
  }

  const profile = await getProfile();
  const gate = await checkChatLimit(user.id, profile, "questions");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "limit", title: gate.title, body: gate.body },
      { status: 402 }
    );
  }

  const cap = limitsFor(profile).maxQuestionsPerBatch;
  const quantidade = Math.max(1, Math.min(cap, body.quantidade ?? 3));

  const { system, user: userPrompt } = buildQuestionsPrompt({
    tema: body.tema,
    quantidade,
    banca: body.banca?.trim() || "ENEM",
    depth: (body.depth ?? "intermediario") as Depth,
  });

  let raw: string;
  try {
    raw = await getChatProvider().generateText({
      system,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.6,
    });
  } catch (err) {
    console.error("questions error:", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const parsed = extractJson(raw);
  if (!parsed) {
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }

  const supabase = createClient();
  await supabase.rpc("bump_chat_usage", { p_user: user.id, p_questions: 1 });
  await logActivity({
    userId: user.id,
    kind: "questions",
    refLabel: body.tema.slice(0, 60),
  });

  return NextResponse.json(parsed);
}
