/**
 * Sistema de anúncios (spec §6, §7). Placements PERMITIDOS — qualquer
 * local fora desta lista nunca exibe anúncio (tela inicial, geração de IA,
 * editor de redação, durante simulados/upload, pagamento, onboarding,
 * páginas Premium, histórico, perfil Premium).
 */
export const ALLOWED_PLACEMENTS = [
  "biblioteca_feed",
  "comunidade_feed",
  "busca_resultados",
  "simulado_fim",
  "blog_artigo",
  "conteudo_publico",
] as const;

export type Placement = (typeof ALLOWED_PLACEMENTS)[number];

export type AdsConfig = {
  enabled: boolean;
  placements: Record<
    string,
    { enabled: boolean; mode: "native" | "code" | "off"; code?: string; frequency?: number }
  >;
};

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  enabled: true,
  placements: Object.fromEntries(
    ALLOWED_PLACEMENTS.map((p) => [p, { enabled: true, mode: "native" as const }])
  ),
};

/**
 * Recomendações nativas (spec §7) — hoje conteúdo interno; a mesma estrutura
 * recebe futuramente anúncios patrocinados, parceiros e afiliados (spec §8).
 */
export type NativeItem = {
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  /** link de afiliado / patrocinado — quando presente, marca como "Patrocinado". */
  affiliateUrl?: string;
  sponsored?: boolean;
};

export const NATIVE_ITEMS: NativeItem[] = [
  {
    eyebrow: "📚 Material recomendado",
    title: "Resumo completo dos temas que mais caem",
    desc: "Assine o Premium e libere os resumos aprofundados da Biblioteca.",
    href: "/precos",
    cta: "Ver planos",
  },
  {
    eyebrow: "📖 Continue aprendendo",
    title: "Treine redação com correção por banca",
    desc: "ENEM, FUVEST, UNICAMP e mais — nota por competência e plano de melhoria.",
    href: "/precos",
    cta: "Conhecer",
  },
  {
    eyebrow: "🎓 Curso recomendado",
    title: "Simulados completos no estilo ENEM",
    desc: "Gere simulados ilimitados e acompanhe sua evolução.",
    href: "/precos",
    cta: "Começar",
  },
];
