import { createServiceClient } from "@/lib/supabase/service";
import { cacheBackend, cacheSet, cacheGet } from "@/lib/cache";
import { aiStatus } from "@/lib/ai";
import { checkEnv } from "@/lib/env";

/**
 * Fase 10 — Painel de saúde do sistema (spec §15, §16).
 *
 * Mede o que dá para medir com honestidade a partir da aplicação:
 *   • latência do banco (ping real);
 *   • latência/round-trip do cache;
 *   • profundidade e atraso da fila de jobs;
 *   • erros nas últimas 24h (system_logs + ai_calls);
 *   • configuração dos provedores de IA e billing.
 * CPU/memória do host não são acessíveis pela runtime serverless → "N/D".
 */

export type HealthCheck = {
  name: string;
  status: "ok" | "degradado" | "erro" | "n/d";
  detail: string;
  latencyMs?: number;
};

export type HealthReport = {
  generatedAt: string;
  overall: "ok" | "degradado" | "erro";
  checks: HealthCheck[];
  queue: { queued: number; running: number; error: number; oldestQueuedMin: number | null };
  errors24h: { logs: number; aiCalls: number };
};

async function timed<T>(fn: () => PromiseLike<T>): Promise<[T, number]> {
  const t0 = Date.now();
  const r = await fn();
  return [r, Date.now() - t0];
}

export async function getHealth(): Promise<HealthReport> {
  const db = createServiceClient();
  const checks: HealthCheck[] = [];

  // 1) Banco de dados
  {
    const [res, ms] = await timed(() =>
      db.from("users").select("id", { count: "estimated", head: true })
    );
    if (res.error) {
      checks.push({
        name: "Banco de dados",
        status: "erro",
        detail: res.error.message || "Falha ao consultar",
      });
    } else {
      checks.push({
        name: "Banco de dados",
        status: ms < 400 ? "ok" : "degradado",
        detail: ms < 400 ? "Respondendo normalmente" : "Latência acima do esperado",
        latencyMs: ms,
      });
    }
  }

  // 2) Cache
  try {
    const probe = `health:probe:${Date.now()}`;
    const [, ms] = await timed(async () => {
      await cacheSet(probe, 1, 10);
      await cacheGet(probe);
    });
    checks.push({
      name: `Cache (${cacheBackend})`,
      status: ms < 300 ? "ok" : "degradado",
      detail:
        cacheBackend === "memory"
          ? "Em memória do processo (sem Redis configurado)"
          : "Redis REST respondendo",
      latencyMs: ms,
    });
  } catch {
    checks.push({ name: "Cache", status: "degradado", detail: "Round-trip falhou" });
  }

  // 3) Fila de jobs
  const queue = { queued: 0, running: 0, error: 0, oldestQueuedMin: null as number | null };
  try {
    const { data: jobs } = await db
      .from("jobs")
      .select("status, created_at")
      .in("status", ["queued", "running", "error"])
      .order("created_at", { ascending: true })
      .limit(500);
    for (const j of jobs ?? []) {
      if (j.status === "queued") {
        queue.queued += 1;
        if (queue.oldestQueuedMin === null)
          queue.oldestQueuedMin = Math.round((Date.now() - +new Date(j.created_at)) / 60000);
      } else if (j.status === "running") queue.running += 1;
      else if (j.status === "error") queue.error += 1;
    }
    const backedUp = queue.queued > 50 || (queue.oldestQueuedMin ?? 0) > 15;
    checks.push({
      name: "Fila de processamento",
      status: queue.error > 20 ? "erro" : backedUp ? "degradado" : "ok",
      detail: `${queue.queued} na fila · ${queue.running} rodando · ${queue.error} com erro`,
    });
  } catch {
    checks.push({ name: "Fila de processamento", status: "n/d", detail: "Tabela indisponível" });
  }

  // 4) Erros 24h
  const since = new Date(Date.now() - 86400_000).toISOString();
  const errors24h = { logs: 0, aiCalls: 0 };
  try {
    const [{ count: lc }, { count: ac }] = await Promise.all([
      db
        .from("system_logs")
        .select("id", { count: "exact", head: true })
        .eq("level", "error")
        .gte("created_at", since),
      db
        .from("ai_calls")
        .select("id", { count: "exact", head: true })
        .eq("ok", false)
        .gte("created_at", since),
    ]);
    errors24h.logs = lc ?? 0;
    errors24h.aiCalls = ac ?? 0;
    checks.push({
      name: "Erros (24h)",
      status: errors24h.logs + errors24h.aiCalls > 50 ? "degradado" : "ok",
      detail: `${errors24h.logs} no log · ${errors24h.aiCalls} chamadas de IA`,
    });
  } catch {
    checks.push({ name: "Erros (24h)", status: "n/d", detail: "Sem telemetria" });
  }

  // 5) Provedores de IA
  const ai = aiStatus();
  checks.push({
    name: "Provedores de IA",
    status: ai.chat === "mock" && ai.vision === "mock" ? "degradado" : "ok",
    detail: `chat: ${ai.chat} · visão: ${ai.vision}`,
  });

  // 6) Billing
  checks.push({
    name: "Pagamentos (Mercado Pago)",
    status: process.env.MERCADOPAGO_ACCESS_TOKEN ? "ok" : "degradado",
    detail: process.env.MERCADOPAGO_ACCESS_TOKEN
      ? "Access token configurado"
      : "Sem token — checkout em modo simulado",
  });

  // 7) Variáveis de ambiente (Fase 12)
  const env = checkEnv();
  checks.push({
    name: "Variáveis de ambiente",
    status: !env.ok
      ? "erro"
      : env.missingOptional.length > 3
        ? "degradado"
        : "ok",
    detail: !env.ok
      ? `faltam obrigatórias: ${env.missingRequired.join(", ")}`
      : env.missingOptional.length
        ? `${env.missingOptional.length} opcional(is) ausente(s) — recursos em modo demo`
        : "todas configuradas",
  });

  // 8) Host (não mensurável na runtime)
  checks.push({ name: "CPU / memória do host", status: "n/d", detail: "Não exposto pela plataforma" });

  const overall: HealthReport["overall"] = checks.some((c) => c.status === "erro")
    ? "erro"
    : checks.some((c) => c.status === "degradado")
      ? "degradado"
      : "ok";

  return { generatedAt: new Date().toISOString(), overall, checks, queue, errors24h };
}
