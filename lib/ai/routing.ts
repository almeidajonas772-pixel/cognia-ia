import { cached } from "@/lib/cache";

/**
 * Fase 15 — Roteamento de modelo.
 *
 * Escolhe o modelo por tarefa, complexidade estimada e plano do usuário.
 * Objetivo: usar o modelo barato no caminho comum e o modelo forte quando o
 * pedido realmente exige (correção de redação, questões difíceis, provas,
 * explicações profundas). Config editável em `site_config.model_routing`.
 */

export type AiTask = "chat" | "summary" | "questions" | "essay" | "memory";
export type Tier = "free" | "premium";

export type Candidate = {
  provider: "openai";
  model: string;
  minComplexity: number;
  premiumOnly?: boolean;
};

type Routes = Record<AiTask, Candidate[]>;

/** Padrões — sobrescritos por `site_config.model_routing` (merge por tarefa). */
export const DEFAULT_ROUTES: Routes = {
  chat: [
    { provider: "openai", model: "gpt-4o", minComplexity: 70 },
    { provider: "openai", model: "gpt-4o-mini", minComplexity: 0 },
  ],
  summary: [
    { provider: "openai", model: "gpt-4o", minComplexity: 55 },
    { provider: "openai", model: "gpt-4o-mini", minComplexity: 0 },
  ],
  questions: [
    { provider: "openai", model: "gpt-4o", minComplexity: 60 },
    { provider: "openai", model: "gpt-4o-mini", minComplexity: 0 },
  ],
  essay: [{ provider: "openai", model: "gpt-4o", minComplexity: 0 }],
  memory: [{ provider: "openai", model: "gpt-4o-mini", minComplexity: 0 }],
};

const COMPLEXITY_KEYWORDS = [
  "demonstre",
  "prove",
  "deduz",
  "passo a passo",
  "explique detalhadamente",
  "por que",
  "porque",
  "compare",
  "analise criticamente",
  "disserta",
  "redação",
  "teorema",
  "integral",
  "derivada",
  "equação",
  "logaritmo",
  "genética",
  "termodinâmica",
];

export type ComplexityInput = {
  text: string;
  depth?: "basico" | "intermediario" | "avancado" | null;
  mode?: string | null;
  hasImages?: boolean;
  historyLen?: number;
  bancaRigor?: number; // 0..100, quando aplicável (redação)
};

/** Estima a complexidade do pedido, 0–100. Heurística barata e determinística. */
export function estimateComplexity(i: ComplexityInput): number {
  let score = 0;
  score += { basico: 10, intermediario: 30, avancado: 55 }[i.depth ?? "intermediario"] ?? 30;

  if (i.mode === "prova") score += 10;
  else if (i.mode === "detalhado") score += 15;
  else if (i.mode === "resumo" || i.mode === "simples") score -= 8;

  const len = (i.text ?? "").trim().length;
  score += Math.min(25, len / 40);

  const lower = (i.text ?? "").toLowerCase();
  let kw = 0;
  for (const k of COMPLEXITY_KEYWORDS) if (lower.includes(k)) kw += 6;
  score += Math.min(30, kw);

  const t = i.text ?? "";
  if (/[∫∑√≈≤≥πλθ∂∇]/u.test(t) || /(\d+\s*[-+*\/^]\s*\d+){2,}/.test(t)) score += 10;

  if (i.hasImages) score += 15;
  if ((i.historyLen ?? 0) > 8) score += 5;
  if (typeof i.bancaRigor === "number") score += Math.round(i.bancaRigor * 0.2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function loadOverrides(): Promise<Partial<Routes>> {
  return cached("ai:routes", 120, async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return {};
    try {
      const res = await fetch(
        `${url}/rest/v1/site_config?key=eq.model_routing&select=value`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(1500),
          next: { revalidate: 120 },
        }
      );
      if (!res.ok) return {};
      const rows = (await res.json()) as { value?: unknown }[];
      const v = rows[0]?.value;
      return v && typeof v === "object" ? (v as Partial<Routes>) : {};
    } catch {
      return {};
    }
  });
}

export type Routed =
  | { provider: "openai"; model: string; task: AiTask; complexity: number }
  | { provider: "mock"; model: "mock"; task: AiTask; complexity: number };

/**
 * Decide o modelo. `live=false` (sem OPENAI_API_KEY) → sempre mock.
 */
export async function routeModel(opts: {
  task: AiTask;
  tier: Tier;
  complexity: number;
  live: boolean;
}): Promise<Routed> {
  const { task, tier, complexity, live } = opts;
  if (!live) return { provider: "mock", model: "mock", task, complexity };

  const overrides = await loadOverrides();
  const list = (overrides[task] && Array.isArray(overrides[task])
    ? (overrides[task] as Candidate[])
    : DEFAULT_ROUTES[task]
  )
    .filter((c) => c && typeof c.model === "string")
    .slice()
    .sort((a, b) => (b.minComplexity ?? 0) - (a.minComplexity ?? 0));

  const pick =
    list.find(
      (c) =>
        complexity >= (c.minComplexity ?? 0) &&
        (!c.premiumOnly || tier === "premium")
    ) ??
    list[list.length - 1] ??
    DEFAULT_ROUTES[task][DEFAULT_ROUTES[task].length - 1];

  return { provider: "openai", model: pick.model, task, complexity };
}
