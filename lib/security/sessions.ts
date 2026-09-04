import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { cached, bust } from "@/lib/cache";
import { clientIp, hashIp } from "@/lib/security/crypto";
import type { Database } from "@/lib/supabase/types";

/**
 * Fase 11 — Gestão de sessões / dispositivos (spec: sessões + logout global).
 *
 * A fonte da verdade dos refresh tokens é o GoTrue (Supabase Auth). Aqui
 * mantemos metadados por sessão para exibir ("dispositivos conectados") e um
 * carimbo `sessions_valid_after` para invalidar em massa: a aplicação recusa
 * qualquer access token cujo `iat` seja anterior a esse instante
 * (checado no layout do app, como o `user_is_blocked` da Fase 9).
 */

export type SessionRow = Database["public"]["Tables"]["user_sessions"]["Row"];

/** Lê o claim `iat` (epoch s) do access token sem validar assinatura. */
export function jwtIat(accessToken: string | null | undefined): number | null {
  if (!accessToken) return null;
  const part = accessToken.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(
      Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { iat?: number };
    return typeof json.iat === "number" ? json.iat : null;
  } catch {
    return null;
  }
}

function deviceLabel(ua: string | null): string {
  if (!ua) return "Dispositivo desconhecido";
  const os =
    /android/i.test(ua) ? "Android" :
    /iphone|ipad|ios/i.test(ua) ? "iOS" :
    /mac os x|macintosh/i.test(ua) ? "macOS" :
    /windows/i.test(ua) ? "Windows" :
    /linux/i.test(ua) ? "Linux" : "Outro";
  const browser =
    /edg\//i.test(ua) ? "Edge" :
    /chrome|crios/i.test(ua) ? "Chrome" :
    /firefox|fxios/i.test(ua) ? "Firefox" :
    /safari/i.test(ua) ? "Safari" : "navegador";
  return `${browser} · ${os}`;
}

const validAfterKey = (userId: string) => `sec:valid-after:${userId}`;

/** Registra (ou "toca") a sessão atual. Idempotente por (user, iat, ip). */
export async function registerSession(params: {
  userId: string;
  accessToken: string | null;
  headers: Headers;
}): Promise<void> {
  const db = createServiceClient();
  const iat = jwtIat(params.accessToken);
  const ua = params.headers.get("user-agent");
  const ipHash = hashIp(clientIp(params.headers));

  await db.rpc("ensure_user_security", { p_user: params.userId });

  let f = db
    .from("user_sessions")
    .select("id")
    .eq("user_id", params.userId)
    .is("revoked_at", null);
  f = iat === null ? f.is("token_iat", null) : f.eq("token_iat", iat);
  if (ipHash) f = f.eq("ip_hash", ipHash);
  const { data: existing } = await f.limit(1).maybeSingle();

  if (existing) {
    await db
      .from("user_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);
    return;
  }

  await db.from("user_sessions").insert({
    user_id: params.userId,
    token_iat: iat,
    user_agent: ua ? ua.slice(0, 400) : null,
    ip_hash: ipHash,
    device_label: deviceLabel(ua),
  });
}

export async function touchSession(userId: string, accessToken: string | null): Promise<void> {
  const iat = jwtIat(accessToken);
  if (iat === null) return;
  const db = createServiceClient();
  await db
    .from("user_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("token_iat", iat)
    .is("revoked_at", null);
}

export async function listSessions(
  userId: string,
  currentAccessToken: string | null
): Promise<(SessionRow & { current: boolean })[]> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("last_seen_at", { ascending: false })
      .limit(50);
    const currentIat = jwtIat(currentAccessToken);
    return (data ?? []).map((s) => ({
      ...s,
      current: s.token_iat != null && s.token_iat === currentIat,
    }));
  } catch {
    return [];
  }
}

/**
 * A sessão atual ainda vale? `false` quando o access token foi emitido antes
 * de um logout global. Cacheado por ~30s por usuário; `bust` na revogação.
 */
export async function isSessionValid(
  userId: string,
  accessToken: string | null
): Promise<boolean> {
  const iat = jwtIat(accessToken);
  if (iat === null) return true; // sem iat legível → não bloqueia
  try {
    const validAfter = await cached(validAfterKey(userId), 30, async () => {
      const db = createServiceClient();
      const { data } = await db
        .from("user_security")
        .select("sessions_valid_after")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.sessions_valid_after ?? null;
    });
    if (!validAfter) return true;
    return iat * 1000 >= new Date(validAfter).getTime() - 1000; // 1s de folga
  } catch {
    return true; // sem service role (modo demo) ou falha → não bloqueia
  }
}

// As RPCs abaixo dependem de auth.uid() (dono ou admin) → cliente de SESSÃO.
export async function revokeSession(sessionId: string): Promise<void> {
  const db = createSessionClient();
  await db.rpc("revoke_session", { p_session: sessionId });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  const db = createSessionClient();
  await db.rpc("revoke_all_sessions", { p_user: userId });
  await bust(validAfterKey(userId));
}
