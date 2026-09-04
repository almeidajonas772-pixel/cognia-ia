"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ListChecks } from "lucide-react";
import { Composer, type PendingImage } from "@/components/chat/Composer";
import { MessageItem } from "@/components/chat/MessageItem";
import { ModeDepth } from "@/components/chat/ModeDepth";
import { LimitDialog } from "@/components/chat/LimitDialog";
import { GenerateDialog } from "@/components/chat/GenerateDialog";
import { useChatStream, type StreamMessage } from "@/lib/chat/useChatStream";
import { updateConversationSettings } from "@/lib/chat/actions";
import type { ChatDepth, ChatMode, Conversation, Message } from "@/lib/chat/types";

const pendingKey = (id: string) => `cogni:chat:pending:${id}`;

export function ChatThread({
  conversation,
  initialMessages,
}: {
  conversation: Conversation;
  initialMessages: Message[];
}) {
  const initial: StreamMessage[] = initialMessages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      attachments: m.attachments,
      favorited: m.favorited,
    }));

  const { messages, streaming, error, limit, setLimit, send, stop } =
    useChatStream(initial);
  const [mode, setMode] = useState<ChatMode>(conversation.mode);
  const [depth, setDepth] = useState<ChatDepth>(conversation.depth);
  const [tool, setTool] = useState<null | "resumo" | "questoes">(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  function doSend(text: string, images: PendingImage[]) {
    send({ conversationId: conversation.id, message: text, mode, depth, images });
  }

  // Primeira mensagem vinda da tela "nova conversa"
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      const raw = sessionStorage.getItem(pendingKey(conversation.id));
      if (raw) {
        sessionStorage.removeItem(pendingKey(conversation.id));
        const parsed = JSON.parse(raw) as {
          message: string;
          images?: PendingImage[];
        };
        if (parsed.message || parsed.images?.length) {
          send({
            conversationId: conversation.id,
            message: parsed.message,
            mode: conversation.mode,
            depth: conversation.depth,
            images: parsed.images,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, [conversation.id, conversation.mode, conversation.depth, send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function onMode(m: ChatMode) {
    setMode(m);
    void updateConversationSettings(conversation.id, { mode: m });
  }
  function onDepth(d: ChatDepth) {
    setDepth(d);
    void updateConversationSettings(conversation.id, { depth: d });
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
          {error && (
            <p className="text-center text-xs text-rose-400">{error}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ModeDepth
              mode={mode}
              depth={depth}
              onMode={onMode}
              onDepth={onDepth}
              compact
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTool("resumo")}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs text-muted hover:text-foreground"
              >
                <FileText className="h-3.5 w-3.5" />
                Resumo
              </button>
              <button
                type="button"
                onClick={() => setTool("questoes")}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs text-muted hover:text-foreground"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Questões
              </button>
            </div>
          </div>
          <Composer onSend={doSend} onStop={stop} streaming={streaming} />
          <p className="text-center text-[11px] text-muted">
            A IA pode errar. Confira informações importantes.
          </p>
        </div>
      </div>

      {limit && (
        <LimitDialog
          title={limit.title}
          body={limit.body}
          onClose={() => setLimit(null)}
        />
      )}
      {tool && (
        <GenerateDialog
          kind={tool}
          defaultDepth={depth}
          onClose={() => setTool(null)}
        />
      )}
    </div>
  );
}
