import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { logEvent } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

/**
 * Fase 12 — coletor de erros de cliente (enviado pelos error boundaries via
 * sendBeacon). Best-effort: valida tamanho, aplica rate limit e grava um
 * `system_logs` nível warn. Nunca 5xx (o beacon ignora a resposta).
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRate(req, "client-error", RATE_RULES.mutation);
    if (limited) return limited;

    const raw = await req.text();
    if (raw.length > 4000) return NextResponse.json({ ok: true });

    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: true });
    }

    const user = await getUser().catch(() => null);
    await logEvent({
      level: "warn",
      source: "client",
      message: String(body.message ?? "erro de cliente").slice(0, 300),
      userId: user?.id ?? null,
      meta: {
        path: String(body.path ?? ""),
        digest: body.digest ? String(body.digest) : undefined,
        area: body.area ? String(body.area) : undefined,
        ua: req.headers.get("user-agent")?.slice(0, 200),
      },
    });
  } catch {
    /* nunca falha */
  }
  return NextResponse.json({ ok: true });
}
