import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import {
  CONSENT_COOKIE,
  persistConsent,
  type Consent,
} from "@/lib/privacy/consent";

export const dynamic = "force-dynamic";

/**
 * Fase 11 — grava o consentimento de cookies. Funciona para visitantes
 * (só o cookie) e para usuários logados (cookie + `user_consent`).
 */
export async function POST(req: Request) {
  const limited = await enforceRate(req, "consent", RATE_RULES.mutation);
  if (limited) return limited;

  let body: { analytics?: boolean; marketing?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const consent: Consent = {
    essential: true,
    analytics: !!body.analytics,
    marketing: !!body.marketing,
    decidedAt: new Date().toISOString(),
  };

  const user = await getUser();
  if (user) {
    try {
      await persistConsent(user.id, {
        analytics: consent.analytics,
        marketing: consent.marketing,
      });
    } catch {
      /* segue mesmo se a persistência falhar — o cookie é o canal primário */
    }
  }

  const res = NextResponse.json({ ok: true, consent });
  res.cookies.set(CONSENT_COOKIE, JSON.stringify(consent), {
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 dias
    sameSite: "lax",
    httpOnly: false, // lido pelo gate de analytics no cliente
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
