export type Role = "user" | "assistant" | "system";

export type AiMessage = {
  role: Role;
  content: string;
};

export type ChatMode = "professor" | "simples" | "detalhado" | "resumo" | "prova";
export type Depth = "basico" | "intermediario" | "avancado";

export type ImageAttachment = {
  /** data URL (data:image/...;base64,...) ou URL pública */
  dataUrl: string;
  name?: string;
};

export type ChatStreamInput = {
  system: string;
  messages: AiMessage[];
  images?: ImageAttachment[];
  temperature?: number;
};

export type SummaryOptions = {
  tema: string;
  depth: Depth;
  formato: "topicos" | "texto" | "flashcards" | "mapa-mental" | "revisao-enem";
  recursos: {
    diagramas?: boolean;
    tabelas?: boolean;
    exemplos?: boolean;
  };
  contexto?: string;
};

export type GeneratedQuestion = {
  enunciado: string;
  alternativas: string[]; // 5 itens, começando com "A) "
  gabarito: number; // índice 0..4
  explicacao: string;
};

export type QuestionOptions = {
  tema: string;
  quantidade: number;
  banca: string; // "ENEM" por padrão
  depth: Depth;
};

export interface AiProvider {
  readonly id: string;
  /** true quando é o provedor real (com chave), false para o mock. */
  readonly live: boolean;
  streamChat(input: ChatStreamInput): AsyncGenerator<string>;
  generateText(input: ChatStreamInput): Promise<string>;
}

export interface VisionProvider {
  readonly id: string;
  readonly live: boolean;
  analyzeImage(input: {
    prompt: string;
    images: ImageAttachment[];
  }): Promise<string>;
}
