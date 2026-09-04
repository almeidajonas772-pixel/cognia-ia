import { createClient } from "@/lib/supabase/server";
import type {
  CompetencyScore,
  EssayError,
  EssaySubmission,
  Improvement,
  MaxScoreGap,
} from "@/lib/redacao/types";

const COLS =
  "id, title, source, raw_text, transcription, transcription_confirmed, banca, rubric_id, correction_type, detail_level, mode, status, grade, grade_max, competencies, errors, improvements, max_score_gap, summary, model, created_at, corrected_at";

function hydrate(row: Record<string, unknown>): EssaySubmission {
  return {
    ...(row as unknown as EssaySubmission),
    competencies: (row.competencies as CompetencyScore[] | null) ?? null,
    errors: (row.errors as EssayError[] | null) ?? null,
    improvements: (row.improvements as Improvement[] | null) ?? null,
    max_score_gap: (row.max_score_gap as MaxScoreGap | null) ?? null,
  };
}

export async function listEssays(userId: string): Promise<EssaySubmission[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("essay_submissions")
    .select(COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(hydrate);
}

export async function getEssay(
  userId: string,
  id: string
): Promise<EssaySubmission | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("essay_submissions")
    .select(COLS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data
    ? hydrate(data as unknown as Record<string, unknown>)
    : null;
}

export type RubricLite = {
  id: string;
  name: string;
  parsed: {
    scaleMax: number;
    criteria: { name: string; weight?: number; max?: number; description?: string }[];
    notes?: string;
    ambiguities?: string[];
  } | null;
};

export async function listRubrics(userId: string): Promise<RubricLite[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("essay_rubrics")
    .select("id, name, parsed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as RubricLite[];
}

export async function getRubric(
  userId: string,
  id: string
): Promise<RubricLite | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("essay_rubrics")
    .select("id, name, parsed")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as RubricLite) ?? null;
}

export type ErrorBankEntry = {
  signature: string;
  label: string;
  category: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
};

export async function getErrorBank(userId: string): Promise<ErrorBankEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("essay_error_bank")
    .select("signature, label, category, occurrences, first_seen, last_seen")
    .eq("user_id", userId)
    .order("occurrences", { ascending: false });
  return (data ?? []) as ErrorBankEntry[];
}
