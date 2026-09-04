"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, MessageSquareText } from "lucide-react";
import type { FavoriteEntry } from "@/lib/progresso/favorites";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  Biblioteca: BookOpen,
  "Respostas da IA": MessageSquareText,
};

export function FavoritesList({ entries }: { entries: FavoriteEntry[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category))),
    [entries]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!cat || e.category === cat) &&
        (!term ||
          e.title.toLowerCase().includes(term) ||
          e.subtitle.toLowerCase().includes(term))
    );
  }, [entries, q, cat]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted">
        Você ainda não favoritou nada. Toque na estrela em um conteúdo da
        biblioteca ou em uma resposta do chat.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nos favoritos"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={!cat} onClick={() => setCat(null)}>
          Todos ({entries.length})
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c} ({entries.filter((e) => e.category === c).length})
          </Chip>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((e) => {
          const Icon = CATEGORY_ICON[e.category] ?? BookOpen;
          return (
            <Link
              key={e.category + e.id}
              href={e.href}
              className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {e.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {e.category} · {e.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted">Nenhum favorito corresponde.</p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-secondary"
          : "border-border text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
