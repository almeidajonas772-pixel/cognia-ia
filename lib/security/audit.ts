import { createServiceClient } from "@/lib/supabase/service";
import { clientIp, hashIp } from "@/lib/security/crypto";
import type { Database } from "@/lib/supabase/types";

/**
 * Fase 11 — Trilha de auditoria de segurança (spec: auditoria).
 *
 * Eventos relevantes de segurança do próprio usuário (login, logout, troca de
 * senha, MFA, revogação de sessão, exportação/exclusão de dados, consentimento,
 * rate limit). Gravado via service role em `security_events` (append-only).
 * Nunca lança.
 */

export type SecurityEventName =
  | "login"
  | "logout"
  | "login_failed"
  | "password_changed"
  | "mfa_enabled"
  | "mfa_disabled"
  | "session_registered"
  | "session_revoked"
  | "sessions_revoked_all"
  | "data_export_requested"
  | "data_export_ready"
  | "account_deletion_requested"
  | "account_deletion_cancelled"
  | "consent_updated"
  | "rate_limited";

type Input = {
  event: SecurityEventName | string;
  userId?: string | null;
  email?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
};

export async function logSecurityEvent(input: Input): Promise<void> {
  try {
    const db = createServiceClient();
    await db.rpc("log_security_event", {
      p_event: input.event,
      p_user: input.userId ?? null,
      p_email: input.email ?? null,
      p_ip_hash: input.ipHash ?? null,
      p_ua: input.userAgent ?? null,
      p_meta: (input.meta ?? {}) as Record<string, unknown>,
    });
  } catch {
    /* auditoria é best-effort */
  }
}

/** Conveniência: extrai ip-hash + user-agent de uma Request e registra. */
export async function logSecurityFromRequest(
  req: Request,
  event: SecurityEventName | string,
  extra: Omit<Input, "event" | "ipHash" | "userAgent"> = {}
): Promise<void> {
  await logSecurityEvent({
    event,
    ipHash: hashIp(clientIp(req.headers)),
    userAgent: req.headers.get("user-agent"),
    ...extra,
  });
}

export type SecurityEventRow = Database["public"]["Tables"]["security_events"]["Row"];

/** Histórico do próprio usuário (RLS já restringe). */
export async function listSecurityEvents(
  userId: string,
  limit = 30
): Promise<SecurityEventRow[]> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("security_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

/** Visão admin: eventos recentes de qualquer usuário, com filtro opcional. */
export async function listRecentSecurityEvents(opts: {
  event?: string;
  limit?: number;
}): Promise<SecurityEventRow[]> {
  try {
    const db = createServiceClient();
    let f = db.from("security_events").select("*");
    if (opts.event) f = f.eq("event", opts.event);
    const { data } = await f
      .order("created_at", { ascending: false })
      .limit(Math.min(opts.limit ?? 100, 300));
    return data ?? [];
  } catch {
    return [];
  }
}
