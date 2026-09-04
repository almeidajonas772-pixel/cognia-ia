import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/admin/guard";
import { processJobs } from "@/lib/queue";
import { logError } from "@/lib/observability/log";
import "@/lib/queue/handlers"; // registra os handlers

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Fase 10 — Worker da fila (spec §2).
 * Autoriza por `CRON_SECRET` (Bearer) ou sessão de admin. Processa um lote e
 * retorna o resumo. Chame em loop (cron a cada minuto) para drenar a fila.
 */
async function authorize(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (secret && header === `Bearer ${secret}`) return true;
  const user = await getUser();
  return !!user && (await isAppAdmin(user.id));
}

export async function POST(req: Request) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 5, 20);

  try {
    const summary = await processJobs(limit);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    await logError("jobs.run", err);
    return NextResponse.json({ error: "worker_failed" }, { status: 500 });
  }
}

export const GET = POST;
