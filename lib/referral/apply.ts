import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/observability/log";

/**
 * Fase 14 — captura e resgate de indicação.
 *
 * O código chega pela URL (`?ref=CODE`), é guardado no cookie `cogni_ref`
 * (client `<RefCapture/>`) e resgatado uma vez quando o novo usuário entra no
 * onboarding: `record_referral` cria a linha em `referrals` (idempotente).
 */

export const REF_COOKIE = "cogni_ref";

const CODE = /^[A-Za-z0-9]{4,16}$/;

export async function redeemReferralOnSignup(): Promise<void> {
  const jar = cookies();
  const code = jar.get(REF_COOKIE)?.value?.trim();
  if (!code || !CODE.test(code)) return;

  try {
    const db = createClient(); // record_referral usa auth.uid()
    const { data } = await db.rpc("record_referral", { p_code: code });
    if (data === true) {
      await logEvent({ source: "referral", message: "vínculo registrado", meta: { code } });
    }
  } catch {
    /* best-effort */
  } finally {
    // consumido — não tenta de novo
    try {
      jar.set(REF_COOKIE, "", { path: "/", maxAge: 0 });
    } catch {
      /* Server Component: ignora (o cookie expira sozinho) */
    }
  }
}
