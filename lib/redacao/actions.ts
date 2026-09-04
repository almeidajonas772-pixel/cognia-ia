"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { BANCA_IDS } from "@/lib/redacao/bancas";
import type {
  CorrectionMode,
  CorrectionType,
  DetailLevel,
  EssaySource,
} from "@/lib/redacao/types";

async function ensurePremium() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!canUseRedacao(profile)) {
    return { user: null, blocked: true as const };
  }
  return { user, blocked: false as const };
}

export type CreateEssayInput = {
  title: string;
  source: EssaySource;
  text?: string; // quando source = 'texto' (já é o texto final)
  transcription?: string; // quando source = 'imagem' | 'pdf'
  banca: string;
  rubricId?: string | null;
  correctionType: CorrectionType;
  detailLevel: DetailLevel;
  mode: CorrectionMode;
};

export async function createEssay(input: CreateEssayInput) {
  const { user, blocked } = await ensurePremium();
  if (blocked || !user) return { ok: false as const, error: "premium_required" };

  const isText = input.source === "texto";
  const banca = input.rubricId
    ? "custom"
    : BANCA_IDS.includes(input.banca)
      ? input.banca
      : "enem";

  const supabase = createClient();
  const { data, error } = await supabase
    .from("essay_submissions")
    .insert({
      user_id: user.id,
      title: input.title.trim().slice(0, 140) || "Redação sem título",
      source: input.source,
      raw_text: isText ? (input.text ?? "").trim() : null,
      transcription: isText ? null : (input.transcription ?? "").trim(),
      transcription_confirmed: isText,
      banca,
      rubric_id: input.rubricId ?? null,
      correction_type: input.correctionType,
      detail_level: input.detailLevel,
      mode: input.mode,
      status: isText ? "transcricao_confirmada" : "aguardando_transcricao",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message };
  revalidatePath("/redacao");
  return { ok: true as const, id: data.id };
}

export async function updateTranscription(id: string, text: string) {
  const { user, blocked } = await ensurePremium();
  if (blocked || !user) return { ok: false as const };
  const supabase = createClient();
  await supabase
    .from("essay_submissions")
    .update({ transcription: text })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "aguardando_transcricao");
  revalidatePath(`/redacao/${id}`);
  return { ok: true as const };
}

/** Confirmação explícita da transcrição (spec §1.2). Só então a correção pode rodar. */
export async function confirmTranscription(id: string) {
  const { user, blocked } = await ensurePremium();
  if (blocked || !user) return { ok: false as const };
  const supabase = createClient();

  const { data: row } = await supabase
    .from("essay_submissions")
    .select("transcription")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("essay_submissions")
    .update({
      raw_text: (row?.transcription ?? "").trim(),
      transcription_confirmed: true,
      status: "transcricao_confirmada",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath(`/redacao/${id}`);
  return { ok: true as const };
}

export async function deleteEssay(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("essay_submissions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/redacao");
  return { ok: true as const };
}
