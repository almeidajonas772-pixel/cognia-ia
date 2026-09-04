export type ChatMode =
  | "professor"
  | "simples"
  | "detalhado"
  | "resumo"
  | "prova";
export type ChatDepth = "basico" | "intermediario" | "avancado";
export type ChatRole = "user" | "assistant" | "system";

export type Conversation = {
  id: string;
  title: string;
  mode: ChatMode;
  depth: ChatDepth;
  pinned: boolean;
  last_message_at: string;
};

export type Attachment = { type: "image"; name: string };

export type Message = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  attachments: Attachment[];
  model: string | null;
  favorited: boolean;
  created_at: string;
};

export type UsageToday = {
  messages: number;
  images: number;
  summaries: number;
  questions: number;
};

export type LimitResult =
  | { allowed: true; remaining: number | null }
  | { allowed: false; reason: string; title: string; body: string };

export const MODE_LABELS: Record<ChatMode, string> = {
  professor: "Professor ENEM",
  simples: "Explicação simples",
  detalhado: "Explicação detalhada",
  resumo: "Estilo resumo",
  prova: "Estilo prova",
};

export const DEPTH_LABELS: Record<ChatDepth, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};
