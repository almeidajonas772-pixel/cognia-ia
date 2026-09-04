import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { logEvent } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fase 13 — captura de lista de espera (modo de lançamento 'waitlist'). */
export async function POST(req: Request) {
  const limited = await enforceRate(req, "waitlist", RATE_RULES.privacy);
  if (limited) return limited;

  let body: { email?: string; source?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 160)
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  try {
    const db = createServiceClient();
    // idempotente: se já existe, tudo certo
    await db
      .from("waitlist")
      .upsert(
        { email, source: (body.source ?? "site").slice(0, 40) },
        { onConflict: "email", ignoreDuplicates: true }
      );
    await logEvent({ source: "waitlist", message: "novo inscrito", meta: { email } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
