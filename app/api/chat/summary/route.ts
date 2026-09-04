import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { getChatProvider } from "@/lib/ai";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
import { checkFeature, consumeFeature } from "@/lib/billing/entitlements";
import type { SummaryOptions } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "summary", RATE_RULES.aiHeavy, user.id);
  if (limited) return limited;

  let body: SummaryOptions;
  try {
    body = (await req.json()) as SummaryOptions;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.tema?.trim()) {
    return NextResponse.json({ error: "tema_required" }, { status: 400 });
  }

  // Controle central de permissões (spec §2). Grátis: 2 resumos / semana (§1).
  const gate = await checkFeature(user.id, "resumo_semanal");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "limit", title: gate.title, body: gate.body },
      { status: 402 }
    );
  }

  const { system, user: userPrompt } = buildSummaryPrompt(body);

  let markdown: string;
  try {
    markdown = await getChatProvider().generateText({
      system,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.5,
    });
  } catch (err) {
    console.error("summary error:", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  await consumeFeature(user.id, "resumo_semanal");
  return NextResponse.json({ markdown });
}
