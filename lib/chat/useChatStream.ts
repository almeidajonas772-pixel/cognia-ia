"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatDepth, ChatMode } from "@/lib/chat/types";

export type StreamMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { type: "image"; name: string }[];
  favorited?: boolean;
  pending?: boolean;
};

export type LimitInfo = { title: string; body: string };

export type SendInput = {
  conversationId: string;
  message: string;
  mode: ChatMode;
  depth: ChatDepth;
  images?: { dataUrl: string; name: string }[];
};

let counter = 0;
const nextId = () => `local-${Date.now()}-${counter++}`;

export function useChatStream(initial: StreamMessage[]) {
  const [messages, setMessages] = useState<StreamMessage[]>(initial);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<LimitInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (input: SendInput) => {
    setError(null);
    setLimit(null);
    setStreaming(true);

    const userMsg: StreamMessage = {
      id: nextId(),
      role: "user",
      content: input.message,
      attachments: input.images?.map((i) => ({ type: "image", name: i.name })),
    };
    const assistantId = nextId();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: input.conversationId,
          message: input.message,
          mode: input.mode,
          depth: input.depth,
          images: input.images,
        }),
        signal: controller.signal,
      });

      if (res.status === 402) {
        const data = await res.json().catch(() => null);
        setLimit({
          title: data?.title ?? "Limite atingido",
          body: data?.body ?? "Recurso do Plano Premium.",
        });
        setMessages((m) => m.filter((x) => x.id !== assistantId));
        setStreaming(false);
        return;
      }
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId ? { ...x, content: acc, pending: true } : x
          )
        );
      }
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId ? { ...x, content: acc, pending: false } : x
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Não foi possível enviar a mensagem. Tente novamente.");
      setMessages((m) => m.filter((x) => x.id !== assistantId));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return {
    messages,
    setMessages,
    streaming,
    error,
    limit,
    setLimit,
    send,
    stop,
  };
}
