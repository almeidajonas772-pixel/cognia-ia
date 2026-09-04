import {
  Award,
  Rocket,
  Flame,
  Zap,
  TrendingUp,
  BookOpen,
  PenLine,
  MessageSquareText,
  Users,
  Gift,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementsView } from "@/lib/gamification/queries";

const ICONS: Record<string, LucideIcon> = {
  Award,
  Rocket,
  Flame,
  Zap,
  TrendingUp,
  BookOpen,
  PenLine,
  MessageSquareText,
  Users,
  Gift,
};

const TIER_RING: Record<string, string> = {
  bronze: "text-amber-500",
  prata: "text-slate-300",
  ouro: "text-yellow-400",
};

/** Fase 14 — grade de conquistas (bloqueadas em cinza). Server component. */
export function AchievementsGrid({ view }: { view: AchievementsView }) {
  const unlockedAt = new Map(view.unlocked.map((u) => [u.id, u.unlockedAt]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {view.catalog.map((a) => {
        const has = view.unlockedIds.has(a.id);
        const Ico = ICONS[a.icon] ?? Award;
        return (
          <div
            key={a.id}
            className={cn(
              "rounded-xl border p-4",
              has
                ? "border-border bg-card"
                : "border-dashed border-border bg-transparent opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  has ? "bg-primary-soft" : "bg-white/5"
                )}
              >
                {has ? (
                  <Ico className={cn("h-5 w-5", TIER_RING[a.tier])} />
                ) : (
                  <Lock className="h-4 w-4 text-muted" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted">{a.description}</p>
                {has && unlockedAt.get(a.id) && (
                  <p className="mt-1 text-[11px] text-secondary">
                    Desbloqueada em{" "}
                    {new Date(unlockedAt.get(a.id)!).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
