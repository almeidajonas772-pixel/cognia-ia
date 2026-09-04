import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logSecurityEvent } from "@/lib/security/audit";

/**
 * Fase 11 — Exclusão de conta (LGPD art. 18, VI).
 *
 * Fluxo com carência: o usuário solicita, a conta fica agendada para
 * `deletion_scheduled_for` (padrão 30 dias) e pode ser cancelada até lá. O cron
 * (`purge_due_deletions`) remove de `auth.users`, e a cascata de FKs apaga
 * todos os dados do app. Até a purga, o layout do app bloqueia o acesso e
 * oferece "cancelar exclusão".
 */

export const DELETION_GRACE_DAYS = 30;

export type DeletionState = {
  requested: boolean;
  requestedAt: string | null;
  scheduledFor: string | null;
};

export async function getDeletionState(userId: string): Promise<DeletionState> {
  const none: DeletionState = { requested: false, requestedAt: null, scheduledFor: null };
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_security")
      .select("deletion_requested_at, deletion_scheduled_for")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      requested: !!data?.deletion_scheduled_for,
      requestedAt: data?.deletion_requested_at ?? null,
      scheduledFor: data?.deletion_scheduled_for ?? null,
    };
  } catch {
    return none; // modo demo / falha → não bloqueia o app
  }
}

export async function requestAccountDeletion(
  userId: string
): Promise<{ ok: true; scheduledFor: string } | { ok: false; error: string }> {
  const db = createClient(); // request_account_deletion usa auth.uid()
  const { data, error } = await db.rpc("request_account_deletion", {
    p_grace_days: DELETION_GRACE_DAYS,
  });
  if (error) return { ok: false, error: error.message };
  await logSecurityEvent({
    event: "account_deletion_requested",
    userId,
    meta: { scheduledFor: data, graceDays: DELETION_GRACE_DAYS },
  });
  return { ok: true, scheduledFor: data as string };
}

export async function cancelAccountDeletion(userId: string): Promise<{ ok: boolean; error?: string }> {
  const db = createClient();
  const { error } = await db.rpc("cancel_account_deletion", {});
  if (error) return { ok: false, error: error.message };
  await logSecurityEvent({ event: "account_deletion_cancelled", userId });
  return { ok: true };
}
