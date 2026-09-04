"use server";

import { requireUser } from "@/lib/auth";
import { syncMfaFlag } from "@/lib/security/mfa";

/** Fase 11 — Server Action chamada pelo <MfaSetup/> após enroll/unenroll. */
export async function syncMfaState(): Promise<{ mfaEnabled: boolean }> {
  const user = await requireUser();
  return syncMfaFlag(user.id);
}
