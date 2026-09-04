import { createServiceClient } from "@/lib/supabase/service";
import { logError, logEvent } from "@/lib/observability/log";
import {
  validateUpload,
  type UploadKind,
} from "@/lib/storage/validate";

/**
 * Fase 10 — Armazenamento de arquivos (spec §3, §18).
 *
 * Usa o Supabase Storage. Um bucket por natureza de arquivo; `avatars` e
 * `blog` são públicos, `essays` e `materials` privados (URL assinada).
 * Toda escrita passa por `validateUpload` e registra metadados em
 * `storage_objects` para auditoria e limpeza.
 */

const BUCKETS: Record<UploadKind, { bucket: string; public: boolean }> = {
  avatar: { bucket: "avatars", public: true },
  blog_cover: { bucket: "blog", public: true },
  essay: { bucket: "essays", public: false },
  material: { bucket: "materials", public: false },
};

function safeName(name: string, ext: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48)
    .toLowerCase();
  return `${base || "arquivo"}-${Date.now().toString(36)}.${ext}`;
}

export type UploadOk = {
  ok: true;
  path: string;
  bucket: string;
  url: string | null; // pública quando o bucket é público
  mime: string;
  size: number;
};
export type UploadFail = { ok: false; error: string };

export async function uploadFile(params: {
  kind: UploadKind;
  ownerId: string;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<UploadOk | UploadFail> {
  const { kind, ownerId, fileName, contentType, bytes } = params;
  const target = BUCKETS[kind];
  if (!target) return { ok: false, error: "tipo inválido" };

  const v = validateUpload(kind, contentType, bytes);
  if (!v.ok) return v;

  const db = createServiceClient();
  const path = `${ownerId}/${safeName(fileName, v.ext)}`;

  const { error: upErr } = await db.storage
    .from(target.bucket)
    .upload(path, bytes, { contentType: v.mime, upsert: false });

  if (upErr) {
    await logError("storage.upload", upErr, { kind, ownerId });
    return { ok: false, error: "falha ao enviar o arquivo" };
  }

  await db.from("storage_objects").insert({
    bucket: target.bucket,
    path,
    owner_id: ownerId,
    kind,
    size_bytes: v.size,
    mime: v.mime,
  });
  await logEvent({
    source: "storage",
    message: `upload ${kind}`,
    userId: ownerId,
    meta: { bucket: target.bucket, path, size: v.size },
  });

  const url = target.public
    ? db.storage.from(target.bucket).getPublicUrl(path).data.publicUrl
    : null;

  return { ok: true, path, bucket: target.bucket, url, mime: v.mime, size: v.size };
}

/** URL assinada (buckets privados). Default 1h. */
export async function signedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const db = createServiceClient();
  const { data } = await db.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const db = createServiceClient();
  await db.storage.from(bucket).remove([path]);
  await db.from("storage_objects").delete().eq("bucket", bucket).eq("path", path);
}
