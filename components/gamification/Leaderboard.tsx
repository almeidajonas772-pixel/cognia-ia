import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Leaderboard as LB } from "@/lib/gamification/queries";

/** Fase 14 — ranking semanal por XP, anonimizado (só "Você" é identificável). */
export function Leaderboard({ data }: { data: LB }) {
  if (data.top.length === 0) {
    return (
      <p className="text-sm text-muted">
        O ranking da semana aparece quando houver atividade suficiente.
      </p>
    );
  }

  const meInTop = data.top.some((r) => r.isMe);

  return (
    <ol className="space-y-1.5">
      {data.top.map((r) => (
        <li
          key={r.rank}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
            r.isMe ? "bg-primary-soft text-foreground" : "text-muted"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="w-5 text-right tabular-nums">{r.rank}º</span>
            {r.rank <= 3 && (
              <Medal
                className={cn(
                  "h-3.5 w-3.5",
                  r.rank === 1 && "text-yellow-400",
                  r.rank === 2 && "text-slate-300",
                  r.rank === 3 && "text-amber-600"
                )}
              />
            )}
            <span>{r.label}</span>
          </span>
          <span className="tabular-nums">{r.xp.toLocaleString("pt-BR")} XP</span>
        </li>
      ))}
      {!meInTop && data.me && (
        <li className="mt-2 flex items-center justify-between rounded-lg bg-primary-soft px-3 py-2 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <span className="w-5 text-right tabular-nums">{data.me.rank}º</span>
            Você
          </span>
          <span className="tabular-nums">
            {data.me.xp.toLocaleString("pt-BR")} XP
          </span>
        </li>
      )}
    </ol>
  );
}
