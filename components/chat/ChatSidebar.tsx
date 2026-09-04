"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  MessageSquare,
  PanelLeft,
  X,
} from "lucide-react";
import {
  createConversation,
  deleteConversation,
  renameConversation,
  togglePinConversation,
} from "@/lib/chat/actions";
import type { Conversation } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function ChatSidebar({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? conversations.filter((c) => c.title.toLowerCase().includes(term))
      : conversations;
    return {
      pinned: list.filter((c) => c.pinned),
      rest: list.filter((c) => !c.pinned),
    };
  }, [conversations, q]);

  async function newChat() {
    const res = await createConversation();
    if (res.ok) {
      setOpen(false);
      router.push(`/chat/${res.id}`);
    }
  }

  const body = (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <button
          type="button"
          onClick={newChat}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no histórico"
            className="h-8 w-full rounded-lg border border-border bg-surface pl-8 pr-2 text-xs text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted">
            Nenhuma conversa ainda.
          </p>
        )}
        {filtered.pinned.length > 0 && (
          <Section title="Fixadas">
            {filtered.pinned.map((c) => (
              <Row
                key={c.id}
                c={c}
                active={c.id === activeId}
                onAction={start}
                onDeleted={() => setOpen(false)}
              />
            ))}
          </Section>
        )}
        {filtered.rest.length > 0 && (
          <Section title={filtered.pinned.length ? "Recentes" : undefined}>
            {filtered.rest.map((c) => (
              <Row
                key={c.id}
                c={c}
                active={c.id === activeId}
                onAction={start}
                onDeleted={() => setOpen(false)}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        {body}
      </aside>

      {/* Mobile toggle + drawer */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-3 z-30 grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted shadow-card lg:hidden"
        aria-label="Conversas"
      >
        <PanelLeft className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-72 border-r border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      {title && (
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  c,
  active,
  onAction,
  onDeleted,
}: {
  c: Conversation;
  active: boolean;
  onAction: (fn: () => void) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg px-2 py-1.5",
        active ? "bg-primary-soft" : "hover:bg-white/5"
      )}
    >
      <Link
        href={`/chat/${c.id}`}
        onClick={onDeleted}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <MessageSquare
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active ? "text-secondary" : "text-muted"
          )}
        />
        <span
          className={cn(
            "truncate text-xs",
            active ? "text-secondary" : "text-foreground"
          )}
        >
          {c.title}
        </span>
      </Link>

      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label={c.pinned ? "Desafixar" : "Fixar"}
          onClick={() => onAction(() => togglePinConversation(c.id, !c.pinned))}
          className="grid h-6 w-6 place-items-center rounded text-muted hover:text-foreground"
        >
          {c.pinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          aria-label="Renomear"
          onClick={() => {
            const name = window.prompt("Novo título", c.title);
            if (name && name.trim())
              onAction(() => renameConversation(c.id, name.trim()));
          }}
          className="grid h-6 w-6 place-items-center rounded text-muted hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label="Excluir"
          onClick={() => {
            if (window.confirm("Excluir esta conversa?")) {
              onDeleted();
              onAction(() => {
                void deleteConversation(c.id);
                if (active) router.push("/chat");
              });
            }
          }}
          className="grid h-6 w-6 place-items-center rounded text-muted hover:text-rose-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
