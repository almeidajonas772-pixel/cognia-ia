import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logSecurityEvent } from "@/lib/security/audit";
import { POLICY_VERSION, TERMS_VERSION } from "@/lib/privacy/versions";
export { POLICY_VERSION, TERMS_VERSION };

/**
 * Fase 11 — Consentimento de cookies / tratamento de dados (LGPD art. 8º).
 *
 * Dois canais que se espelham:
 *  • cookie `cogni_consent` (JSON) — lido no SSR e pelo gate de analytics,
 *    funciona para visitantes não logados;
 *  • tabela `user_consent` — registro durável para usuários logados.
 */

export const CONSENT_COOKIE = "cogni_consent";

export type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null;
};

const DEFAULT: Consent = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
};

export function parseConsentCookie(raw: string | undefined): Consent {
  if (!raw) return DEFAULT;
  try {
    const p = JSON.parse(raw) as Partial<Consent>;
    return {
      essential: true,
      analytics: !!p.analytics,
      marketing: !!p.marketing,
      decidedAt: typeof p.decidedAt === "string" ? p.decidedAt : new Date().toISOString(),
    };
  } catch {
    return DEFAULT;
  }
}

/** Lê o consentimento efetivo (cookie). Uso em Server Components. */
export function readConsent(): Consent {
  return parseConsentCookie(cookies().get(CONSENT_COOKIE)?.value);
}

/** Persiste na tabela (usuário logado). O cookie é gravado no cliente. */
export async function persistConsent(
  userId: string,
  next: { analytics: boolean; marketing: boolean }
): Promise<void> {
  try {
    const db = createClient(); // set_user_consent usa auth.uid()
    await db.rpc("set_user_consent", {
      p_analytics: next.analytics,
      p_marketing: next.marketing,
      p_terms: TERMS_VERSION,
      p_policy: POLICY_VERSION,
    });
    await logSecurityEvent({
      event: "consent_updated",
      userId,
      meta: { analytics: next.analytics, marketing: next.marketing, policy: POLICY_VERSION },
    });
  } catch {
    // o cookie é o canal primário; a persistência é best-effort
  }
}

export async function getStoredConsent(userId: string): Promise<Consent> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_consent")
      .select("analytics, marketing, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return DEFAULT;
    return {
      essential: true,
      analytics: data.analytics,
      marketing: data.marketing,
      decidedAt: data.updated_at,
    };
  } catch {
    return DEFAULT;
  }
}
