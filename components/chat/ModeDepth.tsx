"use client";

import {
  DEPTH_LABELS,
  MODE_LABELS,
  type ChatDepth,
  type ChatMode,
} from "@/lib/chat/types";

export function ModeDepth({
  mode,
  depth,
  onMode,
  onDepth,
  compact = false,
}: {
  mode: ChatMode;
  depth: ChatDepth;
  onMode: (m: ChatMode) => void;
  onDepth: (d: ChatDepth) => void;
  compact?: boolean;
}) {
  const base =
    "rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary/50 focus:outline-none";
  const h = compact ? "h-8" : "h-9";

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={mode}
        onChange={(e) => onMode(e.target.value as ChatMode)}
        className={`${base} ${h}`}
        aria-label="Formato da resposta"
      >
        {(Object.keys(MODE_LABELS) as ChatMode[]).map((m) => (
          <option key={m} value={m}>
            {MODE_LABELS[m]}
          </option>
        ))}
      </select>
      <select
        value={depth}
        onChange={(e) => onDepth(e.target.value as ChatDepth)}
        className={`${base} ${h}`}
        aria-label="Profundidade"
      >
        {(Object.keys(DEPTH_LABELS) as ChatDepth[]).map((d) => (
          <option key={d} value={d}>
            {DEPTH_LABELS[d]}
          </option>
        ))}
      </select>
    </div>
  );
}
