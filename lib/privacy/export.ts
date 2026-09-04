import { createServiceClient } from "@/lib/supabase/service";
import { enqueue } from "@/lib/queue";
import { logSecurityEvent } from "@/lib/security/audit";
import { collectUserData } from "@/lib/privacy/collect";
import type { Database } from "@/lib/supabase/types";

/**
 * Fase 11 — Exportação de dados pessoais (LGPD art. 18, II/V).
 *
 * Assíncrona pela fila (Fase 10): `requestDataExport` cria a linha e enfileira
 * `data_export`; o handler junta tudo, grava um JSON no bucket privado
 * `exports` e marca `ready` com validade de 7 dias.
 */

export const EXPORT_BUCKET = "exports";
export const EXPORT_TTL_DAYS = 7;

export type DataExportRow = Database["public"]["Tables"]["data_exports"]["Row"];

export async function requestDataExport(
  userId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const db = createServiceClient();

    // 1 exportação ativa por vez
    const { data: pending } = await db
      .from("data_exports")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["pending", "processing"])
      .limit(1)
      .maybeSingle();
    if (pending) return { ok: false, error: "already_running" };

    const { data: row, error } = await db
      .from("data_exports")
      .insert({ user_id: userId, status: "pending" })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "insert_failed" };

    await enqueue(
      "data_export",
      { userId, exportId: row.id },
      { userId, maxAttempts: 2, dedupeKey: `export:${row.id}` }
    );
    await logSecurityEvent({
      event: "data_export_requested",
      userId,
      meta: { exportId: row.id },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unavailable" };
  }
}

export async function listExports(userId: string, limit = 10): Promise<DataExportRow[]> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("data_exports")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

/** URL assinada de download, com verificação de dono / validade. */
export async function getExportDownloadUrl(
  userId: string,
  exportId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const db = createServiceClient();
    const { data: row } = await db
      .from("data_exports")
      .select("user_id, status, storage_path, expires_at")
      .eq("id", exportId)
      .maybeSingle();

    if (!row || row.user_id !== userId) return { ok: false, error: "not_found" };
    if (row.status !== "ready" || !row.storage_path) return { ok: false, error: "not_ready" };
    if (row.expires_at && new Date(row.expires_at) < new Date())
      return { ok: false, error: "expired" };

    const { data: signed } = await db.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(row.storage_path, 300, { download: `cogni-ia-dados-${exportId}.json` });
    if (!signed?.signedUrl) return { ok: false, error: "sign_failed" };
    return { ok: true, url: signed.signedUrl };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

/**
 * Executado pelo worker da fila. Junta os dados, grava o JSON e conclui a linha.
 */
export async function runDataExport(userId: string, exportId: string): Promise<void> {
  const db = createServiceClient();
  await db.from("data_exports").update({ status: "processing" }).eq("id", exportId);

  try {
    const bundle = await collectUserData(db, userId);
    const json = JSON.stringify(bundle, null, 2);
    const path = `${userId}/export-${exportId}.json`;

    const { error: upErr } = await db.storage
      .from(EXPORT_BUCKET)
      .upload(path, new TextEncoder().encode(json), {
        contentType: "application/json",
        upsert: true,
      });
    if (upErr) throw upErr;

    const expiresAt = new Date(Date.now() + EXPORT_TTL_DAYS * 86400_000).toISOString();
    await db
      .from("data_exports")
      .update({
        status: "ready",
        storage_path: path,
        size_bytes: json.length,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt,
        error: null,
      })
      .eq("id", exportId);

    await logSecurityEvent({
      event: "data_export_ready",
      userId,
      meta: { exportId, sizeBytes: json.length },
    });
    // O status aparece em /perfil/privacidade (com polling) — sem notificação extra.
  } catch (err) {
    await db
      .from("data_exports")
      .update({
        status: "error",
        error: err instanceof Error ? err.message : "falha ao exportar",
      })
      .eq("id", exportId);
    throw err;
  }
}
