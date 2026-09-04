import { NextResponse } from "next/server";
import { cacheIncr } from "@/lib/cache";
import { clientIp, hashIp } from "@/lib/security/crypto";
import { logSecurityEvent } from "@/lib/security/audit";

/**
 * Fase 11 — Rate limiting (spec: limitar requisições / anti-abuso).
 *
 * Janela fixa sobre a camada de cache KV (`lib/cache`): memória do processo em
 * dev, Upstash Redis em produção (compartilhado entre instâncias). Se o cache
 * falhar, o limiter "abre" (permite) — disponibilidade acima de precisão.
 *
 * Chave = rota + identificador (userId quando logado, senão hash do IP).
 */

export type RateRule = { limit: number; windowSeconds: number };

/** Perfis prontos por tipo de rota. */
export const RATE_RULES = {
  ai: { limit: 30, windowSeconds: 60 },          // chat/resumo/questões/correção/OCR
  aiHeavy: { limit: 8, windowSeconds: 60 },       // geração longa / correção
  upload: { limit: 12, windowSeconds: 60 },
  auth: { limit: 10, windowSeconds: 300 },        // tentativas sensíveis
  mutation: { limit: 40, windowSeconds: 60 },     // posts, comentários, etc.
  privacy: { limit: 5, windowSeconds: 3600 },     // export / exclusão de conta
} as const satisfies Record<string, RateRule>;

export type RateResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
};

export async function checkRate(
  bucket: string,
  identifier: string,
  rule: RateRule
): Promise<RateResult> {
  const slot = Math.floor(Date.now() / 1000 / rule.windowSeconds);
  const key = `rl:${bucket}:${identifier}:${slot}`;
  const count = await cacheIncr(key, rule.windowSeconds);
  const used = count === 0 ? 0 : count; // 0 = cache indisponível → não bloqueia
  return {
    ok: used <= rule.limit,
    remaining: Math.max(0, rule.limit - used),
    limit: rule.limit,
    resetSeconds: rule.windowSeconds - (Math.floor(Date.now() / 1000) % rule.windowSeconds),
  };
}

/**
 * Guarda para Route Handlers. Retorna `null` se liberado, ou uma `NextResponse`
 * 429 pronta se estourou. Uso:
 *
 *   const limited = await enforceRate(req, "chat", RATE_RULES.ai, user?.id);
 *   if (limited) return limited;
 */
export async function enforceRate(
  req: Request,
  bucket: string,
  rule: RateRule,
  userId?: string | null
): Promise<NextResponse | null> {
  const ipHash = hashIp(clientIp(req.headers)) ?? "anon";
  const identifier = userId ? `u:${userId}` : `ip:${ipHash}`;
  const res = await checkRate(bucket, identifier, rule);

  const headers = {
    "X-RateLimit-Limit": String(res.limit),
    "X-RateLimit-Remaining": String(res.remaining),
    "X-RateLimit-Reset": String(res.resetSeconds),
  };

  if (res.ok) return null;

  await logSecurityEvent({
    event: "rate_limited",
    userId: userId ?? null,
    ipHash: ipHash === "anon" ? null : ipHash,
    userAgent: req.headers.get("user-agent"),
    meta: { bucket, limit: rule.limit, windowSeconds: rule.windowSeconds },
  });

  return NextResponse.json(
    { error: "rate_limited", retryAfter: res.resetSeconds },
    { status: 429, headers: { ...headers, "Retry-After": String(res.resetSeconds) } }
  );
}
