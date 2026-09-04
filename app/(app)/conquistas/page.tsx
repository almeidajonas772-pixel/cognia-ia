import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Gift } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getGamification,
  getAchievementsView,
  getWeeklyLeaderboard,
} from "@/lib/gamification/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AchievementsGrid } from "@/components/gamification/AchievementsGrid";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { WeeklyGoalControl } from "@/components/gamification/WeeklyGoalControl";
import { SeenMarker } from "@/components/gamification/SeenMarker";

export const metadata: Metadata = { title: "Conquistas", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConquistasPage() {
  const user = await requireUser();
  const [g, view, board] = await Promise.all([
    getGamification(user.id),
    getAchievementsView(user.id),
    getWeeklyLeaderboard(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SeenMarker pending={view.newUnseen} />
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-secondary" />
        <h1 className="text-xl font-semibold text-foreground">Conquistas e progresso</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-semibold text-foreground">Nível {g.level}</p>
            <p className="text-xs text-muted">{g.xp.toLocaleString("pt-BR")} XP</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${g.progress.pct}%` }}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-semibold text-foreground">{g.currentStreak}</p>
            <p className="text-xs text-muted">
              sequência atual · recorde {g.longestStreak}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-semibold text-foreground">
              {view.unlocked.length}/{view.total}
            </p>
            <p className="text-xs text-muted">conquistas</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta semanal de estudo</CardTitle>
        </CardHeader>
        <CardBody>
          <WeeklyGoalControl
            current={g.weeklyGoalMinutes}
            done={g.weekMinutes}
          />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Suas conquistas</h2>
          <AchievementsGrid view={view} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking da semana</CardTitle>
            </CardHeader>
            <CardBody>
              <Leaderboard data={board} />
              <p className="mt-2 text-[11px] text-muted">
                Por XP ganho nos últimos 7 dias. Anônimo — só você aparece com nome.
              </p>
            </CardBody>
          </Card>
          <Link
            href="/convidar"
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground hover:border-primary/50"
          >
            <Gift className="h-4 w-4 text-secondary" />
            Convide amigos e ganhem XP juntos
          </Link>
        </div>
      </div>
    </div>
  );
}
