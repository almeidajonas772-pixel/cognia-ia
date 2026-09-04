import type {
  ChatMode,
  Depth,
  QuestionOptions,
  SummaryOptions,
} from "@/lib/ai/types";
import type { ContentBrief } from "@/lib/biblioteca/queries";

/** Regras de qualidade e segurança comuns a todas as chamadas (spec §§ 2, 9, 12). */
const QUALITY_RULES = `
REGRAS DE QUALIDADE E CONFIABILIDADE:
- Priorize sempre informação consolidada e alinhada ao ENEM e aos vestibulares.
- Não invente fatos, dados, leis, datas ou citações. Se não tiver certeza, diga isso de forma explícita.
- Nunca afirme "certeza absoluta". Prefira "com base em conteúdo educacional confiável".
- Respostas didáticas, com estrutura lógica clara, exemplos quando ajudar, sem respostas vagas.
- Foco exclusivamente educacional.

LIMITES:
- Não gere conteúdo de apostas, jogos de azar ou palpites esportivos.
- Não dê instruções ilegais ou perigosas.
- Não trate de temas sensíveis fora do contexto educacional.
- Ao descrever imagens, não gere ou edite imagens de pessoas reais nem rostos.
`.trim();

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  professor:
    "Responda como um professor experiente de cursinho: contextualiza, explica o porquê e antecipa a pegadinha da prova.",
  simples:
    "Explique da forma mais simples possível, com frases curtas e uma analogia do dia a dia. Sem jargão desnecessário.",
  detalhado:
    "Explique de forma detalhada e aprofundada, cobrindo nuances, exceções e conexões com outros temas.",
  resumo:
    "Responda em formato de resumo: tópicos e subtópicos objetivos, tabelas quando fizer sentido, sem texto corrido longo.",
  prova:
    "Responda no estilo de prova: seja direto, use a terminologia técnica correta e, quando couber, mostre como a questão cobraria isso.",
};

const DEPTH_INSTRUCTIONS: Record<Depth, string> = {
  basico:
    "Nível básico: assuma pouco conhecimento prévio, defina cada termo técnico.",
  intermediario:
    "Nível intermediário: pode usar termos da área, mas explique os menos comuns.",
  avancado:
    "Nível avançado: pode ser técnico e conciso, foque em nuances e casos limítrofes.",
};

export type MemoryContext = {
  level: Depth | null;
  learningStyle: string | null;
  subjects: string[];
  difficulties: string[];
  notes: string | null;
  /** Fase 15 — memória evolutiva (destilada periodicamente). */
  evolvedSummary?: string | null;
  strengths?: string[];
  weaknesses?: string[];
};

function memoryBlock(m: MemoryContext | null): string {
  if (!m) return "";
  const parts: string[] = [];
  if (m.evolvedSummary) parts.push(`perfil: ${m.evolvedSummary}`);
  if (m.level) parts.push(`nível estimado: ${m.level}`);
  if (m.learningStyle) parts.push(`estilo de aprendizado: ${m.learningStyle}`);
  if (m.strengths?.length)
    parts.push(`pontos fortes: ${m.strengths.join(", ")}`);
  if (m.weaknesses?.length)
    parts.push(`pontos a reforçar: ${m.weaknesses.join(", ")}`);
  if (m.subjects.length)
    parts.push(`matérias já estudadas: ${m.subjects.join(", ")}`);
  if (m.difficulties.length)
    parts.push(`dificuldades recorrentes: ${m.difficulties.join(", ")}`);
  if (m.notes) parts.push(`notas: ${m.notes}`);
  if (parts.length === 0) return "";
  return `\nMEMÓRIA DO ALUNO (use para adaptar a resposta; reforce pontos fracos, não repita o que ele domina):\n- ${parts.join(
    "\n- "
  )}`;
}

function libraryBlock(contents: ContentBrief[]): string {
  if (contents.length === 0) return "";
  const list = contents
    .map(
      (c) =>
        `- ${c.subjectName} › ${c.title} → /biblioteca/${c.subjectSlug}/${c.slug}`
    )
    .join("\n");
  return `\nBIBLIOTECA COGNI IA (recomende 1–2 conteúdos APENAS quando forem realmente pertinentes ao que o aluno perguntou; use exatamente estes links em markdown; se nenhum encaixar, não invente link):\n${list}`;
}

/** System prompt do chat principal. */
export function buildChatSystem(opts: {
  mode: ChatMode;
  depth: Depth;
  memory: MemoryContext | null;
  library: ContentBrief[];
}): string {
  return [
    "Você é o assistente educacional do COGNI IA, focado em ENEM e vestibulares brasileiros.",
    QUALITY_RULES,
    `ESTILO: ${MODE_INSTRUCTIONS[opts.mode]}`,
    `PROFUNDIDADE: ${DEPTH_INSTRUCTIONS[opts.depth]}`,
    "FORMATO: use markdown (títulos, listas, tabelas, negrito). Fórmulas em texto simples.",
    "Se perceber uma lacuna de base do aluno, aponte-a com gentileza e sugira o que revisar.",
    memoryBlock(opts.memory),
    libraryBlock(opts.library),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** System + user prompt para geração de resumo personalizado (spec §2). */
export function buildSummaryPrompt(o: SummaryOptions): {
  system: string;
  user: string;
} {
  const formatoTxt: Record<SummaryOptions["formato"], string> = {
    topicos: "tópicos e subtópicos com marcadores",
    texto: "texto corrido organizado em seções",
    flashcards: "flashcards no formato **Pergunta** / Resposta",
    "mapa-mental": "estrutura de mapa mental (tema central e ramificações aninhadas em listas)",
    "revisao-enem": "revisão rápida para o ENEM: o essencial, o que mais cai e as pegadinhas",
  };
  const recursos: string[] = [];
  if (o.recursos.tabelas) recursos.push("tabelas comparativas");
  if (o.recursos.diagramas)
    recursos.push("descrições de diagramas/esquemas em blocos de citação");
  if (o.recursos.exemplos) recursos.push("exemplos resolvidos");

  return {
    system: [
      "Você gera resumos de estudo para o COGNI IA (ENEM e vestibulares).",
      QUALITY_RULES,
      "Entregue em markdown, pronto para leitura.",
    ].join("\n\n"),
    user: [
      `Crie um resumo sobre: **${o.tema}**.`,
      `Profundidade: ${o.depth}. ${DEPTH_INSTRUCTIONS[o.depth]}`,
      `Formato: ${formatoTxt[o.formato]}.`,
      recursos.length ? `Inclua: ${recursos.join(", ")}.` : "",
      o.contexto ? `Contexto do aluno: ${o.contexto}` : "",
      "Comece com um título e uma frase do que o aluno deve saber ao final.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/** Prompt para geração de questões estilo ENEM (spec §3). Pede JSON. */
export function buildQuestionsPrompt(o: QuestionOptions): {
  system: string;
  user: string;
} {
  return {
    system: [
      "Você elabora questões de múltipla escolha no padrão da banca indicada, para o COGNI IA.",
      QUALITY_RULES,
      "Responda APENAS com JSON válido, sem texto antes ou depois, no formato:",
      `{"questions":[{"enunciado":"...","alternativas":["A) ...","B) ...","C) ...","D) ...","E) ..."],"gabarito":0,"explicacao":"..."}]}`,
      "gabarito é o índice (0 a 4) da alternativa correta.",
    ].join("\n"),
    user: [
      `Banca: ${o.banca}. Tema: ${o.tema}. Quantidade: ${o.quantidade}.`,
      `Nível: ${o.depth}.`,
      "Cada questão: enunciado contextualizado (estilo da banca), 5 alternativas plausíveis e explicação comentada da correta e do erro das demais.",
    ].join("\n"),
  };
}

/** Prompt para análise de imagem (spec §4). */
export function buildVisionPrompt(userText: string): string {
  return [
    "Você analisa imagens de exercícios, gráficos, provas e anotações para o COGNI IA.",
    QUALITY_RULES,
    "Passos: (1) transcreva/descreva o que está na imagem; (2) identifique o que se pede; (3) resolva passo a passo; (4) dê a resposta final e um comentário de como não errar.",
    userText ? `Observação do aluno: ${userText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
