/** Fase 13 — tipos do onboarding. */

export const GOALS = [
  { id: "enem", label: "ENEM" },
  { id: "vestibular", label: "Vestibular específico (FUVEST, UNICAMP…)" },
  { id: "reforco", label: "Reforço escolar / ensino médio" },
  { id: "outro", label: "Outro objetivo" },
] as const;
export type Goal = (typeof GOALS)[number]["id"];

export const LEVELS = [
  { id: "basico", label: "Estou começando", hint: "Explicações do zero" },
  { id: "intermediario", label: "Tenho uma base", hint: "Revisão e prática" },
  { id: "avancado", label: "Já domino bem", hint: "Foco em questões difíceis" },
] as const;
export type Level = (typeof LEVELS)[number]["id"];

/** Matérias-alvo (usa os slugs de área da Biblioteca — Fase 3). */
export const FOCUS_AREAS = [
  { id: "linguagens", label: "Linguagens e Redação" },
  { id: "matematica", label: "Matemática" },
  { id: "natureza", label: "Ciências da Natureza" },
  { id: "humanas", label: "Ciências Humanas" },
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number]["id"];

export type OnboardingState = {
  completed: boolean;
  goal: Goal | null;
  examDate: string | null;
  targetCourse: string | null;
  focusAreas: string[];
  level: Level | null;
  stepsDone: string[];
};

export const EMPTY_ONBOARDING: OnboardingState = {
  completed: false,
  goal: null,
  examDate: null,
  targetCourse: null,
  focusAreas: [],
  level: null,
  stepsDone: [],
};

/** Checklist de primeiros passos (mostrado no dashboard até concluir/dispensar). */
export const FIRST_STEPS: { id: string; label: string; href: string }[] = [
  { id: "biblioteca", label: "Abrir um resumo na Biblioteca", href: "/biblioteca" },
  { id: "chat", label: "Fazer a primeira pergunta ao tutor de IA", href: "/chat" },
  { id: "redacao", label: "Enviar uma redação para correção", href: "/redacao/nova" },
  { id: "comunidade", label: "Entrar num grupo da comunidade", href: "/comunidade" },
  { id: "perfil", label: "Completar o perfil", href: "/perfil" },
];
