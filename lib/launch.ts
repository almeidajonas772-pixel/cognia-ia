import { cached } from "@/lib/cache";

/**
 * Fase 13 — Estado de lançamento da plataforma (editável pelo admin em
 * `site_config.launch`). Fail-open: qualquer falha → `live` com cadastro aberto.
 *
 *   mode:       'live' | 'waitlist' | 'maintenance'
 *   banner:     aviso fixo no topo (string) ou null
 *   signupOpen: cadastro habilitado
 *
 * Usa `fetch` cru contra o PostgREST do Supabase para ser leve o suficiente
 * para rodar também no middleware (Edge).
 */

export type LaunchMode = "live" | "waitlist" | "maintenance";

export type LaunchState = {
  mode: LaunchMode;
  banner: string | null;
  signupOpen: boolean;
};

const DEFAULT_STATE: LaunchState = { mode: "live", banner: null, signupOpen: true };
const VALID_MODES: LaunchMode[] = ["live", "waitlist", "maintenance"];

function normalize(value: unknown): LaunchState {
  const v = (value ?? {}) as Record<string, unknown>;
  const mode = VALID_MODES.includes(v.mode as LaunchMode)
    ? (v.mode as LaunchMode)
    : "live";
  return {
    mode,
    banner:
      typeof v.banner === "string" && v.banner.trim() ? v.banner.trim() : null,
    signupOpen: v.signup_open === undefined ? true : !!v.signup_open,
  };
}

async function fetchLaunchValue(): Promise<unknown> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(
    `${url}/rest/v1/site_config?key=eq.launch&select=value`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(1500),
      // ISR de 60s: mantém as páginas de marketing estáticas/revalidáveis;
      // o middleware ainda checa a cada ~60s pelo cache em memória.
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) throw new Error(`launch ${res.status}`);
  const rows = (await res.json()) as { value?: unknown }[];
  return rows[0]?.value ?? null;
}

export async function getLaunchState(): Promise<LaunchState> {
  return cached("launch:state", 60, async () => {
    try {
      return normalize(await fetchLaunchValue());
    } catch {
      return DEFAULT_STATE;
    }
  });
}

/** Só o `mode` (para o middleware). */
export async function fetchLaunchMode(): Promise<LaunchMode> {
  return (await getLaunchState()).mode;
}
