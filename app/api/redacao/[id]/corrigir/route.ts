import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { enqueue, processJobs } from "@/lib/queue";
import { logError } from "@/lib/observability/log";
import "@/lib/queue/handlers";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/**
 * Fase 10 — Enfileira a correção e tenta processá-la já nesta request
 * (best-effort). Se o processamento inline falhar/estourar tempo, o job fica
 * na fila para o cron retomar com backoff. O cliente acompanha por
 * `GET /api/redacao/[id]/status`.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "corrigir", RATE_RULES.aiHeavy, user.id);
  if (limited) return limited;

  if (!canUseRedacao(await getProfile()))
    return NextResponse.json({ error: "premium_required" }, { status: 402 });

  let jobId: string;
  try {
    const res = await enqueue(
      "essay_correction",
      { userId: user.id, essayId: params.id },
      { userId: user.id, maxAttempts: 3, dedupeKey: `essay:${params.id}` }
    );
    jobId = res.id;
  } catch (err) {
    await logError("redacao.corrigir", err, { essayId: params.id }, user.id);
    return NextResponse.json({ error: "enqueue_failed" }, { status: 500 });
  }

  // tenta drenar agora; erros aqui não são fatais (a fila retoma)
  let inline: Awaited<ReturnType<typeof processJobs>> | null = null;
  try {
    inline = await processJobs(1);
  } catch (err) {
    await logError("redacao.corrigir", err, { phase: "inline", jobId }, user.id);
  }

  return NextResponse.json({ ok: true, jobId, inline });
}
