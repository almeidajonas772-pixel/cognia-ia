import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processJobs } from "@/lib/queue";
import { bust } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { logEvent, logError } from "@/lib/observability/log";
import "@/lib/queue/handlers";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Rotina periódica única (spec §8, §9). Agende (Vercel Cron / cron-job.org) um
 * GET periódico com `Authorization: Bearer <CRON_SECRET>` (Vercel Hobby: 1x/dia
 * via vercel.json; Pro ou cron externo: pode ser mais frequente). Passos tolerantes
 * a falha, em ordem:
 *   1. expira assinaturas vencidas          (Fase 8)
 *   2. publica posts de blog agendados      (Fase 9)
 *   3. drena a fila de jobs                  (Fase 10)
 *   4. limpa telemetria antiga (>90 dias)   (Fase 10)
 *   5. purga contas com exclusão vencida    (Fase 11)
 *   6. expira exportações de dados antigas  (Fase 11)
 *   7. nudges de inatividade + recap semanal (Fase 14)
 *   8. enfileira evolução de memória de perfis vencidos (Fase 15)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const out: Record<string, unknown> = {};

  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      out[name] = await fn();
    } catch (err) {
      out[name] = { error: err instanceof Error ? err.message : "falhou" };
      await logError("cron", err, { step: name });
    }
  };

  await step("expireSubscriptions", async () => {
    const { data } = await db.rpc("expire_due_subscriptions");
    return { expired: data ?? 0 };
  });
  await step("publishScheduledPosts", async () => {
    const { data } = await db.rpc("publish_scheduled_posts");
    if ((data ?? 0) > 0) {
      await bust("blog:");
      revalidatePath("/blog");
    }
    return { published: data ?? 0 };
  });
  await step("processJobs", () => processJobs(15));
  await step("purgeTelemetry", async () => {
    await db.rpc("purge_old_telemetry", { p_days: 90 });
    return { ok: true };
  });
  await step("purgeDueDeletions", async () => {
    const { data } = await db.rpc("purge_due_deletions");
    return { deleted: data ?? 0 };
  });
  await step("expireDueExports", async () => {
    const { data } = await db.rpc("expire_due_exports");
    return { expired: data ?? 0 };
  });
  await step("growthMaintenance", async () => {
    const { data } = await db.rpc("run_growth_maintenance");
    return (data as Record<string, unknown>) ?? {};
  });
  await step("memoryEvolutions", async () => {
    const { data } = await db.rpc("enqueue_due_memory_evolutions");
    return { enqueued: data ?? 0 };
  });

  await logEvent({ source: "cron", message: "tick", meta: out });
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...out });
}

export const POST = GET;
