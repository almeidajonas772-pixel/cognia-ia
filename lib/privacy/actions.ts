"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  requestAccountDeletion,
  cancelAccountDeletion,
} from "@/lib/privacy/deletion";
import { requestDataExport } from "@/lib/privacy/export";
import { persistConsent } from "@/lib/privacy/consent";
import { processJobs } from "@/lib/queue";
import "@/lib/queue/handlers";

/**
 * Fase 11 — Server Actions de privacidade (LGPD). Cada uma revalida a página
 * de privacidade para refletir o novo estado.
 */

export async function requestExportAction() {
  const user = await requireUser();
  const res = await requestDataExport(user.id);
  // Processa a exportação já nesta requisição (best-effort); se falhar/estourar
  // tempo, o job fica na fila e o cron diário conclui.
  if (res.ok) {
    try {
      await processJobs(1);
    } catch {
      /* fica para o cron */
    }
  }
  revalidatePath("/perfil/privacidade");
  return res;
}

export async function requestDeletionAction() {
  const user = await requireUser();
  const res = await requestAccountDeletion(user.id);
  revalidatePath("/perfil/privacidade");
  return res;
}

export async function cancelDeletionAction() {
  const user = await requireUser();
  const res = await cancelAccountDeletion(user.id);
  revalidatePath("/perfil/privacidade");
  revalidatePath("/dashboard");
  return res;
}

export async function saveConsentAction(input: {
  analytics: boolean;
  marketing: boolean;
}) {
  const user = await requireUser();
  await persistConsent(user.id, {
    analytics: !!input.analytics,
    marketing: !!input.marketing,
  });
  revalidatePath("/perfil/privacidade");
  return { ok: true as const };
}
