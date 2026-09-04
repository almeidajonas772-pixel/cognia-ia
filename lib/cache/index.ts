/**
 * Fase 10 — Camada de cache KV (spec §4, §10).
 *
 * Dois back-ends, escolhidos por ambiente:
 *   • Upstash Redis REST  — quando UPSTASH_REDIS_REST_URL/TOKEN existem (produção);
 *   • Memória do processo  — fallback local/serverless sem Redis.
 *
 * A API é a mesma nos dois casos. `cached()` faz memoização com TTL e
 * "stale-on-error" (se a origem falhar, devolve o último valor bom).
 * Somente serialização JSON — não guarde funções/instâncias.
 */

type Entry = { value: unknown; expiresAt: number };

const mem = new Map<string, Entry>();
let lastSweep = 0;

function sweep() {
  const now = Date.now();
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [k, e] of mem) if (e.expiresAt <= now) mem.delete(k);
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const cacheBackend: "redis" | "memory" = REDIS_URL && REDIS_TOKEN ? "redis" : "memory";

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    // nunca deixar o cache travar a request
    signal: AbortSignal.timeout(2500),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (cacheBackend === "redis") {
      const raw = (await redis(["GET", key])) as string | null;
      return raw ? (JSON.parse(raw) as T) : null;
    }
    sweep();
    const e = mem.get(key);
    if (!e) return null;
    if (e.expiresAt <= Date.now()) {
      mem.delete(key);
      return null;
    }
    return e.value as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    if (cacheBackend === "redis") {
      await redis(["SET", key, JSON.stringify(value), "EX", Math.max(1, ttlSeconds)]);
      return;
    }
    mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch {
    /* cache é best-effort */
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (cacheBackend === "redis") await redis(["DEL", key]);
    else mem.delete(key);
  } catch {
    /* ignore */
  }
}

/**
 * Invalida por prefixo (ex.: `bust("blog:")`). Em Redis usa SCAN;
 * em memória varre o Map. Chame após mutações do admin.
 */
export async function bust(prefix: string): Promise<void> {
  try {
    if (cacheBackend === "redis") {
      let cursor = "0";
      do {
        const [next, keys] = (await redis([
          "SCAN",
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          100,
        ])) as [string, string[]];
        cursor = next;
        if (keys.length) await redis(["DEL", ...keys]);
      } while (cursor !== "0");
      return;
    }
    for (const k of mem.keys()) if (k.startsWith(prefix)) mem.delete(k);
  } catch {
    /* ignore */
  }
}

/**
 * Incrementa um contador e garante um TTL. Retorna o valor após o incremento.
 * Usado pelo rate limiter (janela fixa). Em memória é atômico dentro do
 * processo; em Redis usa INCR + EXPIRE (só define o TTL na primeira vez).
 */
export async function cacheIncr(key: string, ttlSeconds: number): Promise<number> {
  try {
    if (cacheBackend === "redis") {
      const n = Number((await redis(["INCR", key])) ?? 0);
      if (n === 1) await redis(["EXPIRE", key, Math.max(1, ttlSeconds)]);
      return n;
    }
    sweep();
    const now = Date.now();
    const e = mem.get(key);
    if (!e || e.expiresAt <= now) {
      mem.set(key, { value: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    e.value = (e.value as number) + 1;
    return e.value as number;
  } catch {
    // Falha do cache não deve bloquear o usuário → trata como "sob o limite".
    return 0;
  }
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * Memoiza `fn` sob `key` por `ttlSeconds`. Deduplica chamadas concorrentes
 * e, se `fn` lançar, tenta devolver o valor em cache (mesmo vencido) antes
 * de propagar o erro.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;

  const p = (async () => {
    try {
      const value = await fn();
      await cacheSet(key, value, ttlSeconds);
      return value;
    } catch (err) {
      // stale-on-error: em memória o valor vencido já foi removido; tenta mesmo assim
      const stale = mem.get(key);
      if (stale) return stale.value as T;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}
