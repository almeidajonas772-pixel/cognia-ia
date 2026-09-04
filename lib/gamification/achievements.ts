/**
 * Fase 14 — catálogo de conquistas (fica no código; o DB guarda só os desbloqueios).
 */

export type AchievementStats = {
  onboardingDone: boolean;
  streak: number;
  longestStreak: number;
  xp: number;
  level: number;
  contentReads: number;
  essaysCorrected: number;
  chatMessages: number;
  communityPosts: number;
  referralsQualified: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  /** nome de ícone lucide-react */
  icon: string;
  tier: "bronze" | "prata" | "ouro";
  test: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "primeiro_passo",
    name: "Primeiro passo",
    description: "Concluiu a configuração inicial",
    icon: "Rocket",
    tier: "bronze",
    test: (s) => s.onboardingDone,
  },
  {
    id: "sequencia_3",
    name: "Pegando o ritmo",
    description: "3 dias seguidos estudando",
    icon: "Flame",
    tier: "bronze",
    test: (s) => s.longestStreak >= 3,
  },
  {
    id: "sequencia_7",
    name: "Uma semana firme",
    description: "7 dias seguidos estudando",
    icon: "Flame",
    tier: "prata",
    test: (s) => s.longestStreak >= 7,
  },
  {
    id: "sequencia_30",
    name: "Hábito de ferro",
    description: "30 dias seguidos estudando",
    icon: "Flame",
    tier: "ouro",
    test: (s) => s.longestStreak >= 30,
  },
  {
    id: "xp_500",
    name: "Aquecendo",
    description: "500 XP acumulados",
    icon: "Zap",
    tier: "bronze",
    test: (s) => s.xp >= 500,
  },
  {
    id: "xp_2000",
    name: "Em chamas",
    description: "2.000 XP acumulados",
    icon: "Zap",
    tier: "prata",
    test: (s) => s.xp >= 2000,
  },
  {
    id: "xp_10000",
    name: "Lendário",
    description: "10.000 XP acumulados",
    icon: "Zap",
    tier: "ouro",
    test: (s) => s.xp >= 10000,
  },
  {
    id: "nivel_5",
    name: "Nível 5",
    description: "Chegou ao nível 5",
    icon: "TrendingUp",
    tier: "bronze",
    test: (s) => s.level >= 5,
  },
  {
    id: "nivel_10",
    name: "Nível 10",
    description: "Chegou ao nível 10",
    icon: "TrendingUp",
    tier: "prata",
    test: (s) => s.level >= 10,
  },
  {
    id: "leitor_10",
    name: "Rato de biblioteca",
    description: "Leu 10 conteúdos",
    icon: "BookOpen",
    tier: "bronze",
    test: (s) => s.contentReads >= 10,
  },
  {
    id: "redator_1",
    name: "Primeira redação",
    description: "Enviou uma redação para correção",
    icon: "PenLine",
    tier: "bronze",
    test: (s) => s.essaysCorrected >= 1,
  },
  {
    id: "redator_10",
    name: "Máquina de escrever",
    description: "10 redações corrigidas",
    icon: "PenLine",
    tier: "prata",
    test: (s) => s.essaysCorrected >= 10,
  },
  {
    id: "curioso_50",
    name: "Cheio de perguntas",
    description: "50 mensagens no chat de IA",
    icon: "MessageSquareText",
    tier: "bronze",
    test: (s) => s.chatMessages >= 50,
  },
  {
    id: "comunidade_1",
    name: "Presente na comunidade",
    description: "Fez a primeira publicação",
    icon: "Users",
    tier: "bronze",
    test: (s) => s.communityPosts >= 1,
  },
  {
    id: "indicou_1",
    name: "Trouxe um amigo",
    description: "1 indicação qualificada",
    icon: "Gift",
    tier: "prata",
    test: (s) => s.referralsQualified >= 1,
  },
  {
    id: "indicou_5",
    name: "Embaixador",
    description: "5 indicações qualificadas",
    icon: "Gift",
    tier: "ouro",
    test: (s) => s.referralsQualified >= 5,
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a): [string, Achievement] => [a.id, a])
);

export function evaluateAchievements(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id);
}
