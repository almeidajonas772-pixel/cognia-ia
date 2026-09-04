import Link from "next/link";
import { Flame, Zap, Trophy, Target, Snowflake } from "lucide-react";
import { getGamification, getAchievementsView } from "@/lib/gamification/queries";

/**
 * Fase 14 — cartão de gamificação no dashboard: nível, XP, sequência e meta
 * semanal. Server component. Fail-open (mostra zeros).
 */
export async function GamificationCard({ userId }: { userId: string }) {
  const [g, ach] = await Promise.all([
    getGamification(userId),
    getAchievementsView(userId),
  ]);

  const goalPct = Math.min(
    100,
    Math.round((g.weekMinutes / Math.max(1, g.weeklyGoalMinutes)) * 100)
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-secondary">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Nível {g.level}
            </p>
            <p className="text-xs text-muted">
              {g.progress.into}/{g.progress.span} XP para o nível {g.level + 1}
            </p>
          </div>
        </div>
        <Link
          href="/conquistas"
          className="text-xs text-secondary hover:underline"
        >
          {ach.unlocked.length}/{ach.total} conquistas
          {ach.newUnseen > 0 ? ` · ${ach.newUnseen} nova(s)` : ""}
        </Link>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${g.progress.pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat icon={<Zap className="h-4 w-4" />} value={g.xp.toLocaleString("pt-BR")} label="XP total" />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          value={String(g.currentStreak)}
          label={`sequência${g.streakFreezes ? ` · ${g.streakFreezes} ❄` : ""}`}
        />
        <Stat
          icon={<Zap className="h-4 w-4" />}
          value={`+${g.weekXp}`}
          label="XP na semana"
        />
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <Target className="h-3.5 w-3.5" /> Meta da semana
          </span>
          <span className="text-foreground">
            {g.weekMinutes}/{g.weeklyGoalMinutes} min
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              goalPct >= 100 ? "bg-emerald-400" : "bg-secondary"
            }`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
      </div>

      {g.streakFreezes > 0 && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
          <Snowflake className="h-3 w-3" /> Você tem {g.streakFreezes} proteção(ões)
          de sequência — perder um dia não zera o streak.
        </p>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-secondary">
        {icon}
        <span className="text-lg font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
