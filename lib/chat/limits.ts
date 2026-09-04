import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/supabase/types";
import type { ChatDepth, LimitResult } from "@/lib/chat/types";

/**
 * Configuração central dos limites do Plano Gratuito (spec §10).
 * Na Fase 8 isso migra para o painel administrativo; aqui fica centralizado.
 */
export const FREE_LIMITS = {
  messagesPerDay: 20,
  imagesPerDay: 0,
  summariesPerDay: 3,
  questionBatchesPerDay: 3,
  maxQuestionsPerBatch: 5,
  /** profundidade "avancado" e geração de imagem são exclusivas do Premium */
  advancedDepth: false as boolean,
};

export const PREMIUM_LIMITS = {
  messagesPerDay: Infinity,
  imagesPerDay: Infinity,
  summariesPerDay: Infinity,
  questionBatchesPerDay: Infinity,
  maxQuestionsPerBatch: 15,
  advancedDepth: true as boolean,
};

export function limitsFor(profile: UserProfile | null) {
  return profile?.plan === "premium" ? PREMIUM_LIMITS : FREE_LIMITS;
}

export const UPGRADE_COPY = {
  title: "Você atingiu o limite do Plano Gratuito.",
  body: "Continue estudando sem limites com o Plano Premium.",
  cta: "Assinar Premium",
};

async function usageToday(userId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("chat_usage")
    .select("messages, images, summaries, questions")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  return {
    messages: data?.messages ?? 0,
    images: data?.images ?? 0,
    summaries: data?.summaries ?? 0,
    questions: data?.questions ?? 0,
  };
}

type Kind = "message" | "image" | "summary" | "questions";

export async function checkChatLimit(
  userId: string,
  profile: UserProfile | null,
  kind: Kind,
  opts?: { depth?: ChatDepth }
): Promise<LimitResult> {
  const lim = limitsFor(profile);

  if (opts?.depth === "avancado" && !lim.advancedDepth) {
    return {
      allowed: false,
      reason: "advanced_depth",
      title: UPGRADE_COPY.title,
      body: "A profundidade avançada é um recurso Premium. " + UPGRADE_COPY.body,
    };
  }

  const used = await usageToday(userId);

  const map: Record<Kind, { used: number; cap: number; label: string }> = {
    message: {
      used: used.messages,
      cap: lim.messagesPerDay,
      label: "mensagens",
    },
    image: { used: used.images, cap: lim.imagesPerDay, label: "análises de imagem" },
    summary: {
      used: used.summaries,
      cap: lim.summariesPerDay,
      label: "resumos",
    },
    questions: {
      used: used.questions,
      cap: lim.questionBatchesPerDay,
      label: "gerações de questões",
    },
  };

  const { used: u, cap, label } = map[kind];
  if (u >= cap) {
    return {
      allowed: false,
      reason: `${kind}_daily_cap`,
      title: UPGRADE_COPY.title,
      body:
        cap === 0
          ? `${label[0].toUpperCase()}${label.slice(1)} são um recurso Premium. ${UPGRADE_COPY.body}`
          : `Você usou suas ${cap} ${label} de hoje. ${UPGRADE_COPY.body}`,
    };
  }

  return {
    allowed: true,
    remaining: cap === Infinity ? null : cap - u,
  };
}
