import type { Banca } from "@/lib/redacao/bancas";
import type {
  CorrectionMode,
  CorrectionType,
  DetailLevel,
} from "@/lib/redacao/types";
import { IMPROVEMENT_AREAS } from "@/lib/redacao/types";

const SAFETY = `
Regras (spec §17):
- Só avalie textos dissertativo-argumentativos (ou do gênero pedido pela banca) em contexto educacional.
- Se o texto não for uma redação, estiver em branco, ou tiver conteúdo ofensivo/ilegal, responda com {"notAnEssay": true, "summary": "<motivo>"} e nada mais.
- Nunca invente trechos que não estão no texto do aluno.
`.trim();

const DETAIL_INSTR: Record<DetailLevel, string> = {
  objetiva: "Seja direto: comentários curtos, no máximo 6 erros (os mais graves).",
  equilibrada: "Equilíbrio entre concisão e explicação. Até 10 erros.",
  detalhada:
    "Seja exaustivo: análise minuciosa, comentário por parágrafo quando fizer sentido, até 16 erros.",
};

const MODE_INSTR: Record<CorrectionMode, string> = {
  treino:
    "MODO TREINO: foco em ensinar. Explique bem cada ponto, dê exemplos de reescrita e estratégias de melhoria. Pode ser um pouco mais generoso na dúvida.",
  simulacao:
    "MODO SIMULAÇÃO OFICIAL: foco em precisão de nota. Aplique o rigor real da banca, sem generosidade. Comentários enxutos e técnicos.",
};

const TYPE_INSTR: Record<CorrectionType, string> = {
  simples:
    "CORREÇÃO SIMPLES: nota final, notas por critério, principais erros e ajustes objetivos.",
  comentada:
    "CORREÇÃO COMENTADA: análise detalhada, justificativa técnica de cada desconto, sugestões de reescrita e exemplos de melhoria.",
};

export type CorrectionPromptInput = {
  text: string;
  banca: Banca;
  type: CorrectionType;
  detail: DetailLevel;
  mode: CorrectionMode;
  rubric?: {
    scaleMax: number;
    criteria: { name: string; weight?: number; max?: number; description?: string }[];
    notes?: string;
  } | null;
};

/** Prompt da correção (spec §§2–8, §12–15). Pede JSON. */
export function buildCorrectionPrompt(input: CorrectionPromptInput): {
  system: string;
  user: string;
} {
  const useRubric = !!input.rubric;
  const scaleMax = useRubric ? input.rubric!.scaleMax : input.banca.scaleMax;

  const criteriaBlock = useRubric
    ? input.rubric!.criteria
        .map(
          (cr, i) =>
            `${i + 1}. ${cr.name}${cr.max ? ` (0–${cr.max})` : ""}${
              cr.weight ? ` [peso ${cr.weight}]` : ""
            }${cr.description ? ` — ${cr.description}` : ""}`
        )
        .join("\n")
    : input.banca.competencies
        .map((c) => `- ${c.id} · ${c.name} (0–${c.max}, peso ${c.weight})`)
        .join("\n");

  const system = [
    `Você é um corretor experiente de redação de ${
      useRubric ? "vestibular/concurso" : input.banca.name
    }. Simule uma correção real (spec §14 — Modo Professor): justifique tecnicamente cada erro, referencie o critério violado e explique o porquê da penalização.`,
    SAFETY,
    useRubric
      ? `Aplique a RUBRICA PERSONALIZADA do usuário. Escala total: 0 a ${scaleMax}.${
          input.rubric!.notes ? ` Observações da rubrica: ${input.rubric!.notes}` : ""
        }`
      : `Aplique os critérios da banca ${input.banca.name}. ${input.banca.rigor}`,
    `CRITÉRIOS:\n${criteriaBlock}`,
    TYPE_INSTR[input.type],
    DETAIL_INSTR[input.detail],
    MODE_INSTR[input.mode],
    "Responda APENAS com JSON válido, sem texto antes/depois, no formato:",
    JSON.stringify(
      {
        notAnEssay: false,
        grade: 0,
        gradeMax: scaleMax,
        competencies: [
          {
            id: "c1",
            name: "nome do critério",
            score: 0,
            max: 0,
            weight: 1,
            comment: "justificativa técnica",
          },
        ],
        errors: [
          {
            excerpt: "trecho exato do texto do aluno",
            explanation: "o que está errado",
            rule: "regra/critério violado (cite a banca)",
            correction: "versão corrigida do trecho",
            rewrite: "sugestão de reescrita mais ampla",
            priority: "critico | importante | medio | bom",
            signature: "tipo-do-erro-em-kebab-case",
            category: "Gramática | Coesão | Argumentação | Ortografia | Pontuação | Estrutura | Tema | Proposta",
          },
        ],
        improvements: IMPROVEMENT_AREAS.map((a) => ({
          area: a,
          priority: "critico | importante | medio | bom",
          note: "orientação objetiva",
        })),
        maxScoreGap: {
          missing: ["o que faltou para a nota máxima"],
          limiting: ["quais critérios mais limitaram a nota"],
          toPerfect: ["ajustes concretos que levariam ao nível máximo"],
        },
        summary: "resumo curto do desempenho",
      },
      null,
      0
    ),
    `IMPORTANTE: o array "improvements" deve conter EXATAMENTE as ${IMPROVEMENT_AREAS.length} áreas listadas acima, cada uma com sua prioridade. "signature" deve ser estável (o mesmo tipo de erro sempre gera a mesma signature).`,
  ].join("\n\n");

  const user = [
    `Banca/escala: ${useRubric ? "rubrica personalizada" : input.banca.name} (0–${scaleMax}).`,
    "Redação do aluno (entre as linhas):",
    "-----",
    input.text,
    "-----",
  ].join("\n");

  return { system, user };
}

/** Prompt de OCR / transcrição (spec §1.2). */
export function buildOcrPrompt(): string {
  return [
    "Transcreva fielmente o texto desta redação (manuscrita, digitalizada ou em PDF).",
    "Preserve a divisão em parágrafos. NÃO corrija erros do autor — apenas resolva ambiguidades óbvias de leitura.",
    "Se houver título, mantenha-o na primeira linha.",
    "Responda somente com o texto transcrito, sem comentários, aspas ou marcações.",
  ].join(" ");
}

/** Prompt de interpretação de rubrica personalizada (spec §2.2). */
export function buildRubricPrompt(raw: string): { system: string; user: string } {
  return {
    system: [
      "Você interpreta rubricas de correção de redação e as estrutura para uso automático.",
      "Responda APENAS com JSON válido:",
      JSON.stringify({
        scaleMax: 0,
        criteria: [
          { name: "", weight: 1, max: 0, description: "" },
        ],
        notes: "",
        ambiguities: ["pontos que precisam de confirmação do usuário"],
      }),
      "Se a escala total não estiver clara, use a soma dos 'max' dos critérios. Liste em 'ambiguities' qualquer critério vago ou peso não informado.",
    ].join("\n"),
    user: `Rubrica enviada pelo usuário:\n-----\n${raw}\n-----`,
  };
}
