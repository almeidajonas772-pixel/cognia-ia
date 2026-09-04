import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fase 10 — Rastreamento de consumo de IA e estimativa de custo (spec §13, §14).
 *
 * Toda chamada a um provedor de IA (chat, resumo, questões, correção, visão/OCR)
 * deve passar por `recordAiCall`. Guardamos provider/modelo/tokens/duração e um
 * custo estimado em USD com base numa tabela de preços aproximada e editável.
 * Sem chave de IA (modo demonstração) nada é cobrado — `cost_usd` fica 0.
 */

/** USD por 1K tokens — valores aproximados de tabela pública, ajuste conforme contrato. */
const PRICE_PER_1K: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
  "gpt-4o": { in: 0.0025, out: 0.01 },
  "gpt-4.1-mini": { in: 0.0004, out: 0.0016 },
  "o4-mini": { in: 0.0011, out: 0.0044 },
  "gemini-1.5-flash": { in: 0.000075, out: 0.0003 },
  "gemini-1.5-pro": { in: 0.00125, out: 0.005 },
  "gemini-2.0-flash": { in: 0.0001, out: 0.0004 },
  mock: { in: 0, out: 0 },
};

function priceFor(model: string | null | undefined) {
  if (!model) return { in: 0.0005, out: 0.0015 };
  const key = Object.keys(PRICE_PER_1K).find((k) => model.includes(k));
  return key ? PRICE_PER_1K[key] : { in: 0.0005, out: 0.0015 };
}

export function estimateCostUsd(
  model: string | null | undefined,
  tokensIn: number,
  tokensOut: number
): number {
  const p = priceFor(model);
  const usd = (tokensIn / 1000) * p.in + (tokensOut / 1000) * p.out;
  return Math.round(usd * 1e6) / 1e6;
}

/** Aproxima contagem de tokens quando o provedor não devolve `usage` (~4 chars/token PT). */
export function approxTokens(text: string): number {
  return Math.ceil((text?.length ?? 0) / 4);
}

export type AiCallInput = {
  provider: string;
  model?: string | null;
  kind: string; // "chat" | "summary" | "questions" | "essay" | "vision" | "ocr" ...
  userId?: string | null;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  ok?: boolean;
  costUsd?: number;
};

export async function recordAiCall(input: AiCallInput): Promise<void> {
  const tokensIn = input.tokensIn ?? 0;
  const tokensOut = input.tokensOut ?? 0;
  const cost =
    input.costUsd ??
    (input.provider === "mock" ? 0 : estimateCostUsd(input.model, tokensIn, tokensOut));
  try {
    const db = createServiceClient();
    await db.rpc("record_ai_call", {
      p_provider: input.provider,
      p_model: input.model ?? null,
      p_kind: input.kind,
      p_user: input.userId ?? null,
      p_tokens_in: tokensIn || null,
      p_tokens_out: tokensOut || null,
      p_duration_ms: input.durationMs ?? null,
      p_cost_usd: cost,
      p_ok: input.ok ?? true,
    });
  } catch {
    /* best-effort */
  }
}

// ── Leitura para o painel admin ───────────────────────────────────────────

export type AiUsageSummary = {
  since: string;
  totals: { calls: number; tokensIn: number; tokensOut: number; costUsd: number; errors: number };
  byProvider: { provider: string; calls: number; costUsd: number }[];
  byKind: { kind: string; calls: number; costUsd: number }[];
  daily: { day: string; calls: number; costUsd: number }[];
  topUsers: { userId: string; email: string | null; calls: number; costUsd: number }[];
};

export async function getAiUsage(days = 30): Promise<AiUsageSummary> {
  const db = createServiceClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await db
    .from("ai_calls")
    .select("provider, model, kind, user_id, tokens_in, tokens_out, cost_usd, ok, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);

  const rows = data ?? [];
  const totals = { calls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, errors: 0 };
  const prov = new Map<string, { calls: number; costUsd: number }>();
  const kind = new Map<string, { calls: number; costUsd: number }>();
  const day = new Map<string, { calls: number; costUsd: number }>();
  const user = new Map<string, { calls: number; costUsd: number }>();

  for (const r of rows) {
    const c = Number(r.cost_usd ?? 0);
    totals.calls += 1;
    totals.tokensIn += r.tokens_in ?? 0;
    totals.tokensOut += r.tokens_out ?? 0;
    totals.costUsd += c;
    if (!r.ok) totals.errors += 1;

    const p = prov.get(r.provider) ?? { calls: 0, costUsd: 0 };
    p.calls += 1;
    p.costUsd += c;
    prov.set(r.provider, p);

    const k = kind.get(r.kind) ?? { calls: 0, costUsd: 0 };
    k.calls += 1;
    k.costUsd += c;
    kind.set(r.kind, k);

    const dk = r.created_at.slice(0, 10);
    const d = day.get(dk) ?? { calls: 0, costUsd: 0 };
    d.calls += 1;
    d.costUsd += c;
    day.set(dk, d);

    if (r.user_id) {
      const u = user.get(r.user_id) ?? { calls: 0, costUsd: 0 };
      u.calls += 1;
      u.costUsd += c;
      user.set(r.user_id, u);
    }
  }

  const topEntries = [...user.entries()]
    .sort((a, b) => b[1].costUsd - a[1].costUsd)
    .slice(0, 10);
  let emails = new Map<string, string | null>();
  if (topEntries.length) {
    const { data: us } = await db
      .from("users")
      .select("id, email")
      .in(
        "id",
        topEntries.map(([id]) => id)
      );
    emails = new Map((us ?? []).map((u) => [u.id, u.email]));
  }

  const round = (n: number) => Math.round(n * 1e4) / 1e4;

  return {
    since,
    totals: { ...totals, costUsd: round(totals.costUsd) },
    byProvider: [...prov.entries()]
      .map(([provider, v]) => ({ provider, calls: v.calls, costUsd: round(v.costUsd) }))
      .sort((a, b) => b.costUsd - a.costUsd),
    byKind: [...kind.entries()]
      .map(([k, v]) => ({ kind: k, calls: v.calls, costUsd: round(v.costUsd) }))
      .sort((a, b) => b.costUsd - a.costUsd),
    daily: [...day.entries()]
      .map(([d, v]) => ({ day: d, calls: v.calls, costUsd: round(v.costUsd) }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    topUsers: topEntries.map(([userId, v]) => ({
      userId,
      email: emails.get(userId) ?? null,
      calls: v.calls,
      costUsd: round(v.costUsd),
    })),
  };
}
