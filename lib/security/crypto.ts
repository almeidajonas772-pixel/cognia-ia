import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Fase 11 — Criptografia de aplicação (spec: criptografia + hash de dados sensíveis).
 *
 * • `encryptField` / `decryptField` — AES-256-GCM para valores sensíveis em
 *   repouso (ex.: bundles de exportação, segredos futuros). Chave derivada de
 *   `APP_ENCRYPTION_KEY` via scrypt. Sem a env, lança — nunca "criptografa" fraco.
 * • `hashIp` — HMAC-SHA256 do IP com `IP_HASH_SECRET` (armazenamos só o hash,
 *   nunca o IP puro — minimização de dados, LGPD art. 6º).
 * • `randomToken` / `safeEqual` — utilidades para tokens de uso único.
 *
 * O transporte já é TLS e o Supabase cifra o disco; isto é cifragem de coluna
 * opcional para dados que não precisam ser pesquisáveis.
 */

const MAGIC = "v1"; // versão do envelope, para rotação futura

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret || secret.length < 16)
    throw new Error("APP_ENCRYPTION_KEY ausente ou curta (>= 16 chars)");
  // sal fixo derivado do próprio segredo: determinístico entre instâncias,
  // sem precisar guardar um sal separado.
  const salt = createHmac("sha256", "cogni-ia:kdf").update(secret).digest();
  cachedKey = scryptSync(secret, salt, 32);
  return cachedKey;
}

export function isEncryptionConfigured(): boolean {
  return !!process.env.APP_ENCRYPTION_KEY && process.env.APP_ENCRYPTION_KEY.length >= 16;
}

/** Retorna `v1:<iv b64>:<tag b64>:<ciphertext b64>`. */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${MAGIC}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptField(envelope: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 4 || parts[0] !== MAGIC)
    throw new Error("envelope de criptografia inválido");
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Hash estável e não reversível de um IP. Usa `IP_HASH_SECRET` quando presente;
 * senão cai para `APP_ENCRYPTION_KEY`; sem nenhum dos dois devolve `null`
 * (preferimos não guardar nada a guardar algo fraco).
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env.IP_HASH_SECRET || process.env.APP_ENCRYPTION_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(ip.trim()).digest("hex").slice(0, 32);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Extrai o IP do cliente a partir dos headers de proxy usuais. */
export function clientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null;
}
