import type { AiProvider, ChatStreamInput, AiMessage } from "@/lib/ai/types";

const BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

type OpenAIContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

function toOpenAiMessages(input: ChatStreamInput) {
  const msgs: { role: string; content: OpenAIContent }[] = [
    { role: "system", content: input.system },
  ];
  input.messages.forEach((m: AiMessage, idx) => {
    const isLast = idx === input.messages.length - 1;
    if (isLast && m.role === "user" && input.images?.length) {
      msgs.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          ...input.images.map((img) => ({
            type: "image_url" as const,
            image_url: { url: img.dataUrl },
          })),
        ],
      });
    } else {
      msgs.push({ role: m.role, content: m.content });
    }
  });
  return msgs;
}

async function call(model: string, input: ChatStreamInput, stream: boolean) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY ausente");

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: toOpenAiMessages(input),
      temperature: input.temperature ?? 0.4,
      stream,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res;
}

/**
 * Provedor OpenAI para um modelo específico. Fase 15 — o roteador escolhe o
 * modelo por tarefa/complexidade; sem argumento usa `OPENAI_CHAT_MODEL`.
 */
export function makeOpenAiProvider(model: string = DEFAULT_MODEL): AiProvider {
  return {
    id: model,
    live: true,

    async *streamChat(input) {
      const res = await call(model, input, true);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta as string;
          } catch {
            // fragmento incompleto — ignora
          }
        }
      }
    },

    async generateText(input) {
      const res = await call(model, input, false);
      const json = await res.json();
      return (json.choices?.[0]?.message?.content ?? "").trim();
    },
  };
}

export const openaiProvider: AiProvider = makeOpenAiProvider();
