/**
 * Fase 10 — Validação de upload (spec §3, §18).
 *
 * Defesa em profundidade: além do `accept` do input, checamos no servidor
 * (1) tipo declarado, (2) tamanho e (3) "magic bytes" reais do arquivo, para
 * não confiar só na extensão/Content-Type que o cliente manda.
 */

export type UploadKind = "avatar" | "essay" | "material" | "blog_cover";

type Rule = { mimes: string[]; maxBytes: number; exts: string[] };

const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, Rule> = {
  avatar: { mimes: ["image/png", "image/jpeg", "image/webp"], maxBytes: 2 * MB, exts: ["png", "jpg", "jpeg", "webp"] },
  essay: {
    mimes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    maxBytes: 12 * MB,
    exts: ["png", "jpg", "jpeg", "webp", "pdf"],
  },
  material: {
    mimes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    maxBytes: 15 * MB,
    exts: ["png", "jpg", "jpeg", "webp", "pdf"],
  },
  blog_cover: { mimes: ["image/png", "image/jpeg", "image/webp"], maxBytes: 4 * MB, exts: ["png", "jpg", "jpeg", "webp"] },
};

/** Assinaturas binárias conhecidas. Retorna o mime real ou null. */
export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "image/webp";
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  return null;
}

export function extFromMime(mime: string): string {
  return (
    { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" }[
      mime
    ] ?? "bin"
  );
}

export type ValidationResult =
  | { ok: true; mime: string; ext: string; size: number }
  | { ok: false; error: string };

export function validateUpload(
  kind: UploadKind,
  declaredType: string,
  bytes: Uint8Array
): ValidationResult {
  const rule = UPLOAD_RULES[kind];
  if (!rule) return { ok: false, error: "tipo de upload desconhecido" };
  if (bytes.byteLength === 0) return { ok: false, error: "arquivo vazio" };
  if (bytes.byteLength > rule.maxBytes)
    return {
      ok: false,
      error: `arquivo acima do limite de ${Math.round(rule.maxBytes / MB)} MB`,
    };

  const real = sniffMime(bytes);
  if (!real) return { ok: false, error: "formato de arquivo não reconhecido" };
  if (!rule.mimes.includes(real))
    return { ok: false, error: `formato ${real} não permitido para "${kind}"` };
  if (declaredType && !declaredType.startsWith("multipart") && declaredType !== real)
    return { ok: false, error: "tipo declarado diverge do conteúdo do arquivo" };

  return { ok: true, mime: real, ext: extFromMime(real), size: bytes.byteLength };
}
