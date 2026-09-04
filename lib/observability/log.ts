import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

/**
 * Fase 10 — Logging estruturado (spec §7).
 *
 * Grava em `system_logs` via service role (funciona em rotas, actions, jobs e
 * webhooks, sem depender de sessão). Nunca lança: um log que falha não pode
 * derrubar o fluxo principal. Sempre também ecoa no console para o provedor
 * de logs da hospedagem (Vercel/Render) capturar.
 */

export type LogLevel = Database["public"]["Enums"]["log_level"];

type LogInput = {
  level?: LogLevel;
  source: string;
  message: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
};

export async function logEvent({
  level = "info",
  source,
  message,
  userId = null,
  meta = {},
}: LogInput): Promise<void> {
  const line = `[${level}] ${source}: ${message}`;
  if (level === "error") console.error(line, meta);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  try {
    const db = createServiceClient();
    await db.rpc("log_system_event", {
      p_level: level,
      p_source: source,
      p_message: message,
      p_user: userId,
      p_meta: meta as Record<string, unknown>,
    });
  } catch {
    /* telemetria é best-effort */
  }
}

/** Atalho para erros — aceita o `unknown` de um catch. */
export async function logError(
  source: string,
  err: unknown,
  meta: Record<string, unknown> = {},
  userId: string | null = null
): Promise<void> {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "erro desconhecido";
  await logEvent({
    level: "error",
    source,
    message,
    userId,
    meta: {
      ...meta,
      ...(err instanceof Error && err.stack ? { stack: err.stack.split("\n").slice(0, 4) } : {}),
    },
  });
}

export type SystemLogRow = Database["public"]["Tables"]["system_logs"]["Row"];

/** Leitura para o painel admin (RLS já restringe a admins). */
export async function listLogs(opts: {
  level?: LogLevel | "all";
  source?: string;
  limit?: number;
}): Promise<SystemLogRow[]> {
  const db = createServiceClient();
  // filtros ANTES de order()/limit() — o TransformBuilder não expõe .eq()/.ilike()
  let f = db.from("system_logs").select("*");
  if (opts.level && opts.level !== "all") f = f.eq("level", opts.level);
  if (opts.source) f = f.ilike("source", `%${opts.source}%`);
  const { data } = await f
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 100, 300));
  return data ?? [];
}
