/**
 * Fase 12 — Inventário e checagem de variáveis de ambiente.
 *
 * NÃO lança. A plataforma inteira funciona em "modo demonstração" sem chaves;
 * esta checagem só produz avisos legíveis (usados no boot em dev e no painel
 * `/admin/saude`). A fonte da verdade de cada variável continua sendo o
 * `.env.example`.
 */

export type EnvVar = {
  name: string;
  required: boolean;
  phase: number;
  purpose: string;
  /** Sem esta variável, o recurso cai para: */
  fallback: string;
};

export const ENV_VARS: EnvVar[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    phase: 2,
    purpose: "Endpoint do projeto Supabase",
    fallback: "login e todas as rotas do app ficam indisponíveis",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    phase: 2,
    purpose: "Chave pública (RLS) do Supabase",
    fallback: "login e todas as rotas do app ficam indisponíveis",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    phase: 8,
    purpose: "Webhooks, cron, telemetria, filas, LGPD",
    fallback: "billing simulado; telemetria/fila/exportação desligadas",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: false,
    phase: 1,
    purpose: "URL canônica (SEO, OG, links de webhook)",
    fallback: "usa https://cogniai.com.br",
  },
  {
    name: "OPENAI_API_KEY",
    required: false,
    phase: 4,
    purpose: "Chat, resumos, questões, correção de redação",
    fallback: "provedor mock (respostas-esqueleto)",
  },
  {
    name: "GEMINI_API_KEY",
    required: false,
    phase: 4,
    purpose: "OCR / análise de imagem",
    fallback: "OCR mock",
  },
  {
    name: "MERCADOPAGO_ACCESS_TOKEN",
    required: false,
    phase: 8,
    purpose: "Assinaturas recorrentes",
    fallback: "checkout em modo simulado",
  },
  {
    name: "MERCADOPAGO_WEBHOOK_SECRET",
    required: false,
    phase: 8,
    purpose: "Validação do webhook de pagamento",
    fallback: "webhook aceita sem verificação de segredo",
  },
  {
    name: "NEXT_PUBLIC_GA_ID",
    required: false,
    phase: 9,
    purpose: "Google Analytics (com consentimento)",
    fallback: "sem analytics de terceiros",
  },
  {
    name: "GOOGLE_SITE_VERIFICATION",
    required: false,
    phase: 13,
    purpose: "Meta tag de verificação do Google Search Console",
    fallback: "verificar o domínio por outro método (DNS/arquivo)",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    required: false,
    phase: 10,
    purpose: "Cache/rate-limit compartilhado entre instâncias",
    fallback: "cache em memória do processo (por instância)",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    required: false,
    phase: 10,
    purpose: "Token do Upstash Redis REST",
    fallback: "cache em memória do processo (por instância)",
  },
  {
    name: "CRON_SECRET",
    required: false,
    phase: 10,
    purpose: "Protege /api/cron e /api/jobs/run",
    fallback: "rotas de cron só aceitam sessão de admin",
  },
  {
    name: "APP_ENCRYPTION_KEY",
    required: false,
    phase: 11,
    purpose: "Cifra de coluna (AES-GCM) e hash de IP",
    fallback: "recursos que cifram lançam; IP não é registrado",
  },
  {
    name: "IP_HASH_SECRET",
    required: false,
    phase: 11,
    purpose: "Segredo dedicado ao hash de IP",
    fallback: "usa APP_ENCRYPTION_KEY",
  },
];

export type EnvReport = {
  ok: boolean;
  missingRequired: string[];
  missingOptional: string[];
  present: string[];
};

export function checkEnv(source: NodeJS.ProcessEnv = process.env): EnvReport {
  const has = (n: string) => {
    const v = source[n];
    return typeof v === "string" && v.trim().length > 0;
  };
  const missingRequired = ENV_VARS.filter((e) => e.required && !has(e.name)).map((e) => e.name);
  const missingOptional = ENV_VARS.filter((e) => !e.required && !has(e.name)).map((e) => e.name);
  const present = ENV_VARS.filter((e) => has(e.name)).map((e) => e.name);
  return { ok: missingRequired.length === 0, missingRequired, missingOptional, present };
}

/** Log de boot (chamado uma vez por `instrumentation.ts`). Só em dev/não-teste. */
export function logEnvReportOnce(): void {
  if (process.env.NODE_ENV === "test") return;
  const r = checkEnv();
  if (r.missingRequired.length) {
    console.warn(
      `[env] faltam variáveis OBRIGATÓRIAS: ${r.missingRequired.join(", ")} — ` +
        "login e rotas do app não vão funcionar. Ver .env.example."
    );
  }
  if (process.env.NODE_ENV !== "production" && r.missingOptional.length) {
    console.info(
      `[env] opcionais ausentes (recursos em modo demo): ${r.missingOptional.join(", ")}`
    );
  }
}
