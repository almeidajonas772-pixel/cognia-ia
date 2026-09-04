export type ActivityKind =
  | "content_read"
  | "content_completed"
  | "chat"
  | "questions"
  | "essay"
  | "community";

export type DifficultyLevel = "facil" | "medio" | "dificil";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  subject_slug: string | null;
  ref_id: string | null;
  ref_label: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export type SubjectMastery = {
  slug: string;
  name: string;
  area: string;
  total: number;
  done: number;
  pct: number;
  /** 0–100, combina conclusão + dificuldade percebida + revisão */
  mastery: number;
  lastActivityAt: string | null;
};

export type DayPoint = { day: string; minutes: number; activities: number };

export type Recommendation = {
  id: string;
  kind: "estudar" | "revisar" | "praticar" | "simulado";
  title: string;
  reason: string;
  href: string;
};

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  content_read: "Leu um conteúdo",
  content_completed: "Concluiu um conteúdo",
  chat: "Conversou com a IA",
  questions: "Gerou questões",
  essay: "Enviou uma redação",
  community: "Publicou na comunidade",
};

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};
