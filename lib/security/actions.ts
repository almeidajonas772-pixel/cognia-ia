"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { revokeSession, revokeAllSessions } from "@/lib/security/sessions";
import { logSecurityEvent } from "@/lib/security/audit";

/** Fase 11 — Server Actions de segurança (sessões). */

export async function revokeSessionAction(sessionId: string) {
  const user = await requireUser();
  await revokeSession(sessionId);
  await logSecurityEvent({ event: "session_revoked", userId: user.id, meta: { sessionId } });
  revalidatePath("/perfil/seguranca");
  return { ok: true as const };
}

export async function revokeAllSessionsAction() {
  const user = await requireUser();
  await revokeAllSessions(user.id);
  await logSecurityEvent({ event: "sessions_revoked_all", userId: user.id });
  revalidatePath("/perfil/seguranca");
  return { ok: true as const };
}
