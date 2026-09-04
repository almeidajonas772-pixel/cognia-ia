import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { getResilientVisionProvider } from "@/lib/ai";
import { logError } from "@/lib/observability/log";
import { canUseRedacao } from "@/lib/redacao/access";
import { buildOcrPrompt } from "@/lib/redacao/prompts";
import type { ImageAttachment } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** OCR de imagem / PDF de redação (spec §1.2). */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "ocr", RATE_RULES.aiHeavy, user.id);
  if (limited) return limited;

  if (!canUseRedacao(await getProfile()))
    return NextResponse.json({ error: "premium_required" }, { status: 402 });

  let body: { images?: ImageAttachment[] };
  try {
    body = (await req.json()) as { images?: ImageAttachment[] };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const images = (body.images ?? []).slice(0, 6);
  if (images.length === 0)
    return NextResponse.json({ error: "no_files" }, { status: 400 });

  try {
    const transcription = await getResilientVisionProvider("ocr", user.id).analyzeImage({
      prompt: buildOcrPrompt(),
      images,
    });
    return NextResponse.json({ transcription: transcription.trim() });
  } catch (err) {
    await logError("redacao.ocr", err, {}, user.id);
    return NextResponse.json({ error: "ocr_failed" }, { status: 502 });
  }
}
