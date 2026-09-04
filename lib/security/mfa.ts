import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logSecurityEvent } from "@/lib/security/audit";

/**
 * Fase 11 — 2FA / MFA (spec: preparo para 2FA).
 *
 * O enrolamento TOTP (gerar segredo, ler QR, confirmar código) roda no cliente
 * com `supabase.auth.mfa.*`. Estas funções de servidor refletem o resultado em
 * `user_security.mfa_enabled` (leitura rápida / visão do admin) e registram a
 * auditoria. Sem Supabase conectado, tudo degrada para `false`.
 *
 * A Server Action chamada pelo cliente vive em `mfa-actions.ts`.
 */

export async function getMfaEnabled(userId: string): Promise<boolean> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_security")
      .select("mfa_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    return data?.mfa_enabled ?? false;
  } catch {
    return false;
  }
}

/** Relê os fatores no servidor e sincroniza o espelho `mfa_enabled`. */
export async function syncMfaFlag(userId: string): Promise<{ mfaEnabled: boolean }> {
  const supabase = createClient();

  let enabled = false;
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    enabled = !!data?.totp?.some((f) => f.status === "verified");
  } catch {
    enabled = false;
  }

  try {
    const db = createServiceClient();
    await db.rpc("ensure_user_security", { p_user: userId });
    const { data: prev } = await db
      .from("user_security")
      .select("mfa_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if ((prev?.mfa_enabled ?? false) !== enabled) {
      await db.from("user_security").update({ mfa_enabled: enabled }).eq("user_id", userId);
      await logSecurityEvent({
        event: enabled ? "mfa_enabled" : "mfa_disabled",
        userId,
      });
    }
  } catch {
    /* espelho/auditoria best-effort */
  }

  return { mfaEnabled: enabled };
}
