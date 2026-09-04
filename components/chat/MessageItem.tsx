"use client";

import { useState, useTransition } from "react";
import { Star, Copy, Check, ImageIcon, Sparkles } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { toggleFavoriteMessage } from "@/lib/chat/actions";
import type { StreamMessage } from "@/lib/chat/useChatStream";
import { cn } from "@/lib/utils";

export function MessageItem({ message }: { message: StreamMessage }) {
  const isUser = message.role === "user";
  const persisted = !message.id.startsWith("local-");
  const [fav, setFav] = useState(!!message.favorited);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();

  function copy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function favorite() {
    if (!persisted) return;
    const next = !fav;
    setFav(next);
    start(async () => {
      const res = await toggleFavoriteMessage(message.id, next);
      if (!res?.ok) setFav(!next);
    });
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold",
          isUser ? "bg-white/10 text-foreground" : "bg-primary-soft text-secondary"
        )}
      >
        {isUser ? "EU" : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn("min-w-0 max-w-[85%]", isUser && "text-right")}>
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("mb-1 flex gap-1", isUser && "justify-end")}>
            {message.attachments.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted"
              >
                <ImageIcon className="h-3 w-3" />
                {a.name}
              </span>
            ))}
          </div>
        )}

        {isUser ? (
          <div className="inline-block whitespace-pre-wrap rounded-2xl bg-white/[0.06] px-4 py-2 text-left text-sm text-foreground">
            {message.content || <span className="text-muted">(imagem)</span>}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            {message.content ? (
              <ChatMarkdown>{message.content}</ChatMarkdown>
            ) : (
              <span className="inline-flex gap-1 py-1">
                <Dot /> <Dot /> <Dot />
              </span>
            )}

            {!message.pending && message.content && (
              <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                {persisted && (
                  <button
                    type="button"
                    onClick={favorite}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/5",
                      fav ? "text-amber-400" : "text-muted hover:text-foreground"
                    )}
                  >
                    <Star className={cn("h-3 w-3", fav && "fill-amber-400")} />
                    {fav ? "Favoritada" : "Favoritar"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />;
}
