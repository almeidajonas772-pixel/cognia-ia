import { createClient } from "@/lib/supabase/server";
import type { ActivityKind } from "@/lib/progresso/types";

/**
 * Registra uma atividade no histórico unificado (spec §3) e no rollup diário.
 * Chamado pelos módulos de Biblioteca (Fase 3) e Chat (Fase 4). Silencioso:
 * nunca deve quebrar o fluxo principal.
 */
export async function logActivity(input: {
  userId: string;
  kind: ActivityKind;
  subjectSlug?: string | null;
  refId?: string | null;
  refLabel?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const supabase = createClient();
    await supabase.rpc("log_activity", {
      p_user: input.userId,
      p_kind: input.kind,
      p_subject: input.subjectSlug ?? null,
      p_ref_id: input.refId ?? null,
      p_ref_label: input.refLabel ?? null,
      p_meta: input.meta ?? {},
    });
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}
