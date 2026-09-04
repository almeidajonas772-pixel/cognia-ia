export type EssayStatus =
  | "rascunho"
  | "aguardando_transcricao"
  | "transcricao_confirmada"
  | "corrigindo"
  | "corrigida"
  | "erro";
export type EssaySource = "texto" | "imagem" | "pdf";
export type CorrectionType = "simples" | "comentada";
export type DetailLevel = "objetiva" | "equilibrada" | "detalhada";
export type CorrectionMode = "treino" | "simulacao";
export type Priority = "critico" | "importante" | "medio" | "bom";

/** As 13 áreas fixas do feedback inteligente (spec §12). */
export const IMPROVEMENT_AREAS = [
  "Argumentação",
  "Repertório sociocultural",
  "Coesão textual",
  "Progressão de ideias",
  "Uso de conectivos",
  "Gramática",
  "Ortografia",
  "Pontuação",
  "Clareza da tese",
  "Estrutura dos parágrafos",
  "Proposta de intervenção",
  "Vocabulário",
  "Organização textual",
] as const;

export type CompetencyScore = {
  id: string;
  name: string;
  score: number;
  max: number;
  weight: number;
  comment: string;
};

export type EssayError = {
  excerpt: string;
  explanation: string;
  rule: string;
  correction: string;
  rewrite: string;
  priority: Priority;
  signature: string;
  category: string;
};

export type Improvement = {
  area: string;
  priority: Priority;
  note: string;
};

export type MaxScoreGap = {
  missing: string[];
  limiting: string[];
  toPerfect: string[];
};

export type CorrectionResult = {
  grade: number;
  gradeMax: number;
  competencies: CompetencyScore[];
  errors: EssayError[];
  improvements: Improvement[];
  maxScoreGap: MaxScoreGap;
  summary: string;
  notAnEssay?: boolean;
};

export type EssaySubmission = {
  id: string;
  title: string;
  source: EssaySource;
  raw_text: string | null;
  transcription: string | null;
  transcription_confirmed: boolean;
  banca: string;
  rubric_id: string | null;
  correction_type: CorrectionType;
  detail_level: DetailLevel;
  mode: CorrectionMode;
  status: EssayStatus;
  grade: number | null;
  grade_max: number | null;
  competencies: CompetencyScore[] | null;
  errors: EssayError[] | null;
  improvements: Improvement[] | null;
  max_score_gap: MaxScoreGap | null;
  summary: string | null;
  model: string | null;
  created_at: string;
  corrected_at: string | null;
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; color: string; weight: number }
> = {
  critico: { label: "Crítico", dot: "🔴", color: "text-rose-400", weight: 3 },
  importante: { label: "Importante", dot: "🟠", color: "text-amber-400", weight: 2 },
  medio: { label: "Médio", dot: "🟡", color: "text-yellow-300", weight: 1 },
  bom: { label: "Bom", dot: "🟢", color: "text-emerald-400", weight: 0 },
};

export const DETAIL_LABEL: Record<DetailLevel, string> = {
  objetiva: "Objetiva",
  equilibrada: "Equilibrada",
  detalhada: "Extremamente detalhada",
};

export const TYPE_LABEL: Record<CorrectionType, string> = {
  simples: "Correção simples",
  comentada: "Correção comentada",
};

export const MODE_LABEL: Record<CorrectionMode, string> = {
  treino: "Modo treino",
  simulacao: "Modo simulação oficial",
};
