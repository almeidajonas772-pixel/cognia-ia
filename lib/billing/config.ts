/** Preços oficiais (spec §3). */
export const PRICES = {
  mensal: { price: 14.9, label: "R$ 14,90/mês" },
  anual: { price: 119.9, label: "R$ 119,90/ano", monthlyEquivalent: 9.99 },
} as const;

export type BillingCycle = "mensal" | "anual";

/** Funcionalidades limitadas / exclusivas (spec §1, §2, §5). */
export type Feature =
  | "resumo_semanal" // resumos personalizados via IA (grátis: 2/semana)
  | "chat_mensagem" // mensagens do chat (grátis: N/dia)
  | "questao" // geração de questões (grátis: N/dia)
  | "exportacao" // exportar arquivos (grátis: N/dia)
  | "simulado"; // simulados completos (grátis: N/dia)

/** Gates booleanos (Premium liga/desliga). */
export type Gate =
  | "resumo_completo"
  | "redacao"
  | "memoria_avancada"
  | "estatisticas_avancadas"
  | "sem_anuncios"
  | "grupo_privado"
  | "prioridade_processamento";

export type FreeLimits = {
  resumo_semanal: number;
  chat_mensagem_dia: number;
  questao_dia: number;
  exportacao_dia: number;
  simulado_dia: number;
  favoritos_max: number;
  historico_dias: number;
  grupos_post_dia: number;
};

/** Defaults — sobrescritos por `billing_config.plan_limits` (admin edita). */
export const DEFAULT_FREE_LIMITS: FreeLimits = {
  resumo_semanal: 2,
  chat_mensagem_dia: 20,
  questao_dia: 3,
  exportacao_dia: 5,
  simulado_dia: 1,
  favoritos_max: 20,
  historico_dias: 14,
  grupos_post_dia: 8,
};

/** feature -> chave de limite + tipo de período. */
export const FEATURE_META: Record<
  Feature,
  { limitKey: keyof FreeLimits; period: "dia" | "semana"; label: string }
> = {
  resumo_semanal: { limitKey: "resumo_semanal", period: "semana", label: "resumos" },
  chat_mensagem: { limitKey: "chat_mensagem_dia", period: "dia", label: "mensagens" },
  questao: { limitKey: "questao_dia", period: "dia", label: "gerações de questões" },
  exportacao: { limitKey: "exportacao_dia", period: "dia", label: "exportações" },
  simulado: { limitKey: "simulado_dia", period: "dia", label: "simulados" },
};

/** Cópia oficial da tela de limite (spec §1). */
export const UPGRADE_COPY = {
  title: "Você atingiu o limite do Plano Gratuito.",
  body: "Continue estudando sem limites com o Plano Premium.",
  cta: "Assinar Premium",
};

/** Matriz para a página "Comparar Planos" (spec §4.1). */
export const PLAN_MATRIX: {
  feature: string;
  free: string;
  premium: string;
}[] = [
  { feature: "Biblioteca", free: "Resumos rápidos", premium: "Completa" },
  { feature: "Resumos rápidos", free: "Ilimitado", premium: "Ilimitado" },
  { feature: "Resumos completos", free: "—", premium: "Ilimitado" },
  { feature: "Chat IA", free: "Limite diário", premium: "Ilimitado" },
  { feature: "Limite de resumos", free: "2 por semana", premium: "Ilimitado" },
  { feature: "Limite de questões", free: "Limite diário", premium: "Ilimitado" },
  { feature: "Correção de redação", free: "—", premium: "Incluída" },
  { feature: "Simulados", free: "Limitado", premium: "Completos" },
  { feature: "Memória da IA", free: "Básica", premium: "Completa" },
  { feature: "Histórico", free: "14 dias", premium: "Completo" },
  { feature: "Estatísticas", free: "Básicas", premium: "Avançadas" },
  { feature: "Comunidade", free: "Incluída", premium: "Incluída + grupos privados" },
  { feature: "Exportação de arquivos", free: "Limitada", premium: "Ilimitada" },
  { feature: "Anúncios", free: "Sim", premium: "Sem anúncios" },
  { feature: "Recursos futuros", free: "—", premium: "Incluídos" },
];
