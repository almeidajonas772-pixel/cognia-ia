export type LibraryArea =
  | "linguagens"
  | "matematica"
  | "natureza"
  | "humanas"
  | "redacao";

export type Recurrence =
  | "muito_recorrente"
  | "recorrente"
  | "ocasional"
  | "raro";

export interface Subject {
  id: string;
  area: LibraryArea;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  slug: string;
  name: string;
  position: number;
}

export interface Content {
  id: string;
  topic_id: string;
  subject_id: string;
  slug: string;
  title: string;
  summary_short: string;
  recurrence: Recurrence;
  reading_minutes: number;
  position: number;
}

/** Estado do usuário sobre um conjunto de conteúdos. */
export interface LibraryUserState {
  completed: Set<string>; // chave: `${subjectSlug}/${contentSlug}`
  favorites: Set<string>; // content.id
  lastViewed: Map<string, string>; // content.id -> ISO date
}

/** item_type usado na tabela `favorites` (Fase 2) para conteúdos da biblioteca. */
export const FAVORITE_TYPE = "library_content";

export const AREA_LABELS: Record<LibraryArea, string> = {
  linguagens: "Linguagens",
  matematica: "Matemática",
  natureza: "Ciências da Natureza",
  humanas: "Ciências Humanas",
  redacao: "Redação",
};

export const AREA_ORDER: LibraryArea[] = [
  "linguagens",
  "matematica",
  "natureza",
  "humanas",
  "redacao",
];
