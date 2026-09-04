import type {
  AiProvider,
  ChatStreamInput,
  VisionProvider,
} from "@/lib/ai/types";

const OFFLINE_NOTE =
  "> ℹ️ **Modo demonstração** — nenhum modelo de IA está conectado (`OPENAI_API_KEY` ausente). " +
  "A estrutura abaixo é um esqueleto para você testar a interface; conecte uma chave para respostas reais.";

function lastUser(input: ChatStreamInput): string {
  for (let i = input.messages.length - 1; i >= 0; i--) {
    if (input.messages[i].role === "user") return input.messages[i].content;
  }
  return "";
}

/** Recomenda um conteúdo da biblioteca se o título casar com a pergunta. */
function libraryHint(system: string, question: string): string {
  const q = question.toLowerCase();
  const lines = system.split("\n").filter((l) => l.includes("→ /biblioteca/"));
  for (const line of lines) {
    const m = line.match(/- (.+?) › (.+?) → (\/biblioteca\/\S+)/);
    if (!m) continue;
    const title = m[2].toLowerCase();
    const words = title.split(/\W+/).filter((w) => w.length > 4);
    if (words.some((w) => q.includes(w))) {
      return `\n\n📚 **Na biblioteca:** [${m[2]}](${m[3]}) (${m[1]}).`;
    }
  }
  return "";
}

function buildAnswer(input: ChatStreamInput): string {
  const question = lastUser(input);
  const isJson = input.system.includes("APENAS com JSON");
  const tema = question.replace(/\s+/g, " ").trim().slice(0, 120) || "o tema";

  if (isJson) {
    // Geração de questões — devolve JSON válido de exemplo.
    const n = Math.max(1, Math.min(5, (question.match(/\d+/)?.[0] ? Number(question.match(/\d+/)![0]) : 3)));
    const questions = Array.from({ length: n }, (_, i) => ({
      enunciado: `(${i + 1}) Questão de exemplo sobre ${tema}. Conecte OPENAI_API_KEY para gerar questões reais no estilo da banca.`,
      alternativas: [
        "A) Alternativa de exemplo",
        "B) Alternativa de exemplo",
        "C) Alternativa correta (exemplo)",
        "D) Alternativa de exemplo",
        "E) Alternativa de exemplo",
      ],
      gabarito: 2,
      explicacao:
        "Explicação de exemplo. No modo real, aqui viria o comentário da correta e o motivo do erro das demais.",
    }));
    return JSON.stringify({ questions });
  }

  if (input.system.includes("gera resumos de estudo")) {
    return [
      `# Resumo — ${tema}`,
      "",
      OFFLINE_NOTE,
      "",
      "## O essencial",
      "- Conceito central e por que ele importa.",
      "- Como se relaciona com temas vizinhos.",
      "",
      "## O que mais cai",
      "- Aplicações típicas de prova.",
      "",
      "## Erros comuns",
      "- Confusões frequentes a evitar.",
    ].join("\n");
  }

  return [
    `**${tema}**`,
    "",
    OFFLINE_NOTE,
    "",
    "**Definição.** Ponto de partida do conceito.",
    "",
    "**Como funciona.** A lógica passo a passo.",
    "",
    "**No ENEM.** Como a prova costuma cobrar isso.",
    "",
    "**Erro comum.** O deslize que mais tira ponto.",
    "",
    "_Com base em conteúdo educacional confiável; conecte um modelo para uma resposta completa._" +
      libraryHint(input.system, question),
  ].join("\n");
}

async function* streamString(text: string): AsyncGenerator<string> {
  const tokens = text.split(/(\s+)/);
  for (const t of tokens) {
    yield t;
    await new Promise((r) => setTimeout(r, 12));
  }
}

export const mockProvider: AiProvider = {
  id: "mock",
  live: false,
  async *streamChat(input) {
    yield* streamString(buildAnswer(input));
  },
  async generateText(input) {
    return buildAnswer(input);
  },
};

export const mockVision: VisionProvider = {
  id: "mock",
  live: false,
  async analyzeImage({ prompt }) {
    void prompt;
    return [
      OFFLINE_NOTE.replace("OPENAI_API_KEY", "GEMINI_API_KEY"),
      "",
      "**1. O que há na imagem:** (transcrição indisponível no modo demonstração)",
      "**2. O que se pede:** —",
      "**3. Resolução passo a passo:** —",
      "**4. Resposta e como não errar:** conecte `GEMINI_API_KEY` para a análise real.",
    ].join("\n");
  },
};
