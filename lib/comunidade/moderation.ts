import { getChatProvider } from "@/lib/ai";
import type { ModerationStatus } from "@/lib/comunidade/types";

export type ModerationResult = {
  status: ModerationStatus; // 'aprovado' | 'revisao' | 'bloqueado'
  reason: string | null;
};

const OFFENSIVE = [
  "idiota",
  "imbecil",
  "otario",
  "otário",
  "lixo humano",
  "vai se",
  "porra",
  "merda",
  "arrombad",
  "desgraçad",
  "viado",
  "retardad",
];
const SPAM = [
  "ganhe dinheiro",
  "renda extra",
  "clique aqui",
  "whatsapp (",
  "aposta",
  "bet ",
  "cassino",
  "promoção imperdível",
  "frete grátis",
];

/** Heurística local — funciona sem chave de IA (spec §9, §21). */
function heuristic(text: string): ModerationResult {
  const t = text.toLowerCase();

  if (OFFENSIVE.some((w) => t.includes(w))) {
    return { status: "bloqueado", reason: "Possível linguagem ofensiva." };
  }
  if (SPAM.some((w) => t.includes(w))) {
    return { status: "revisao", reason: "Possível spam / propaganda." };
  }
  const links = (text.match(/https?:\/\//g) ?? []).length;
  if (links >= 4) {
    return { status: "revisao", reason: "Muitos links." };
  }
  const letters = text.replace(/[^a-zà-ú]/gi, "");
  const caps = text.replace(/[^A-ZÀ-Ú]/g, "");
  if (letters.length > 30 && caps.length / letters.length > 0.6) {
    return { status: "revisao", reason: "Texto quase todo em maiúsculas." };
  }
  return { status: "aprovado", reason: null };
}

/**
 * Moderação antes de publicar (spec §9). Heurística sempre; IA quando disponível.
 * A IA pode elevar para 'revisao'/'bloqueado', nunca reverter um bloqueio da heurística.
 */
export async function moderateContent(
  text: string
): Promise<ModerationResult> {
  const base = heuristic(text);
  if (base.status === "bloqueado") return base;

  const provider = getChatProvider();
  if (!provider.live) return base;

  try {
    const out = await provider.generateText({
      system:
        "Você modera uma comunidade de estudos. Classifique o texto quanto a spam, ofensa, discurso de ódio, conteúdo ilegal, plágio evidente e propaganda. Responda APENAS com JSON: " +
        '{"status":"aprovado|revisao|bloqueado","reason":"curto"}. Use "bloqueado" só para casos claros de ofensa/ilegalidade; "revisao" para dúvida.',
      messages: [{ role: "user", content: text.slice(0, 4000) }],
      temperature: 0,
    });
    const m = out.match(/\{[\s\S]*\}/);
    if (m) {
      const j = JSON.parse(m[0]) as { status?: string; reason?: string };
      if (j.status === "bloqueado")
        return { status: "bloqueado", reason: j.reason ?? "Conteúdo inadequado." };
      if (j.status === "revisao" && base.status === "aprovado")
        return { status: "revisao", reason: j.reason ?? "Encaminhado para revisão." };
    }
  } catch {
    /* mantém a heurística */
  }
  return base;
}
