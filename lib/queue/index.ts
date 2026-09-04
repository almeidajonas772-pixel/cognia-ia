import { createServiceClient } from "@/lib/supabase/service";
import { logError, logEvent } from "@/lib/observability/log";
import type { Database } from "@/lib/supabase/types";

/**
 * Fase 10 — Fila de processamento assíncrono (spec §2, §5).
 *
 * Jobs vivem na tabela `jobs`. `enqueue()` insere; um worker (rota /api/jobs/run
 * ou o cron) chama `processJobs()`, que reivindica um lote via `claim_jobs`
 * (SELECT … FOR UPDATE SKIP LOCKED, atômico) e roda o handler registrado.
 * Falhas são reprogramadas com backoff exponencial até `max_attempts`.
 *
 * Escolha de projeto: fila no Postgres em vez de um broker dedicado — zero
 * infraestrutura extra, transacional, e suficiente para a escala inicial.
 * A troca por SQS/QStash depois é local a este arquivo.
 */

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export type JobContext = {
  job: JobRow;
  /** Atualiza o progresso (0–100) para a UI que faz polling. */
  setProgress: (n: number) => Promise<void>;
  db: ReturnType<typeof createServiceClient>;
};

export type JobHandler = (
  payload: Record<string, unknown>,
  ctx: JobContext
) => Promise<Record<string, unknown> | void>;

const handlers = new Map<string, JobHandler>();

export function registerHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

export type EnqueueOptions = {
  userId?: string | null;
  maxAttempts?: number;
  /** Atraso mínimo antes de rodar, em segundos. */
  delaySeconds?: number;
  /** Se true, não insere outro job `queued`/`running` com a mesma `dedupeKey` em payload. */
  dedupeKey?: string;
};

export async function enqueue(
  type: string,
  payload: Record<string, unknown> = {},
  opts: EnqueueOptions = {}
): Promise<{ id: string } | { deduped: true; id: string }> {
  const db = createServiceClient();

  if (opts.dedupeKey) {
    const { data: existing } = await db
      .from("jobs")
      .select("id")
      .eq("type", type)
      .in("status", ["queued", "running"])
      .contains("payload", { dedupeKey: opts.dedupeKey })
      .limit(1)
      .maybeSingle();
    if (existing) return { deduped: true, id: existing.id };
  }

  const runAfter = opts.delaySeconds
    ? new Date(Date.now() + opts.delaySeconds * 1000).toISOString()
    : undefined;

  const { data, error } = await db
    .from("jobs")
    .insert({
      type,
      payload: opts.dedupeKey ? { ...payload, dedupeKey: opts.dedupeKey } : payload,
      user_id: opts.userId ?? null,
      max_attempts: opts.maxAttempts ?? 3,
      run_after: runAfter,
    })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("enqueue failed");
  await logEvent({ source: "queue", message: `enqueued ${type}`, meta: { jobId: data.id } });
  return { id: data.id };
}

export async function getJob(id: string): Promise<JobRow | null> {
  const db = createServiceClient();
  const { data } = await db.from("jobs").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

/**
 * Reivindica e executa até `limit` jobs. Idempotente e seguro para rodar em
 * paralelo (SKIP LOCKED). Retorna um resumo do lote.
 */
export async function processJobs(limit = 5): Promise<{
  claimed: number;
  done: number;
  failed: number;
  skipped: number;
}> {
  const db = createServiceClient();
  const { data: claimed, error } = await db.rpc("claim_jobs", { p_limit: limit });
  if (error) {
    await logError("queue", error, { phase: "claim" });
    return { claimed: 0, done: 0, failed: 0, skipped: 0 };
  }

  const jobs = (claimed ?? []) as JobRow[];
  let done = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    const handler = handlers.get(job.type);
    if (!handler) {
      skipped += 1;
      await db.rpc("finish_job", {
        p_id: job.id,
        p_status: "error",
        p_result: null,
        p_error: `sem handler para "${job.type}"`,
      });
      await logError("queue", `sem handler para ${job.type}`, { jobId: job.id });
      continue;
    }

    const ctx: JobContext = {
      job,
      db,
      setProgress: async (n) => {
        await db.rpc("set_job_progress", { p_id: job.id, p_progress: Math.round(n) });
      },
    };

    try {
      const result = (await handler(job.payload ?? {}, ctx)) ?? {};
      await db.rpc("finish_job", {
        p_id: job.id,
        p_status: "done",
        p_result: result as Record<string, unknown>,
        p_error: null,
      });
      done += 1;
      await logEvent({
        source: "queue",
        message: `done ${job.type}`,
        meta: { jobId: job.id, attempts: job.attempts },
      });
    } catch (err) {
      failed += 1;
      await db.rpc("finish_job", {
        p_id: job.id,
        p_status: "error",
        p_result: null,
        p_error: err instanceof Error ? err.message : "erro no handler",
      });
      await logError("queue", err, { jobId: job.id, type: job.type, attempts: job.attempts });
    }
  }

  return { claimed: jobs.length, done, failed, skipped };
}
