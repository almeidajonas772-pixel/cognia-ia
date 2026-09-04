import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import {
  getProgressCore,
  computeOverall,
  computeSubjectMastery,
  computeWeakSpots,
  getStudyStats,
  getTimeline,
  getActivityCounts,
} from "@/lib/progresso/queries";
import { getRecommendations } from "@/lib/progresso/recommendations";
import { getFavoritesData } from "@/lib/progresso/favorites";
import { progressLimits } from "@/lib/progresso/limits";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { DonutProgress, Sparkline, BarChart } from "@/components/progresso/Charts";
import {
  StatCard,
  SubjectMasteryList,
  RecommendationsCard,
  WeakSpotsCard,
  PremiumLockCard,
} from "@/components/progresso/Panels";
import { ActivityTimeline } from "@/components/progresso/ActivityTimeline";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { GamificationCard } from "@/components/gamification/GamificationCard";
import { AdaptivePlanCard } from "@/components/adaptive/AdaptivePlanCard";
import { ACTIVITY_LABEL, type ActivityKind } from "@/lib/progresso/types";

export const metadata: Metadata = { title: "Dashboard" };

function fmtMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 ? ` ${m % 60}min` : ""}`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfile();
  const lim = progressLimits(profile);
  const firstName = (profile?.full_name || user.email || "").split(" ")[0];

  const [core, stats, recs, recent, counts, favs] = await Promise.all([
    getProgressCore(user.id),
    getStudyStats(user.id),
    getRecommendations(user.id, profile),
    getTimeline(user.id, { items: 6 }),
    getActivityCounts(user.id),
    getFavoritesData(user.id),
  ]);

  const overall = computeOverall(core);
  const mastery = computeSubjectMastery(core);
  const weak = computeWeakSpots(core);
  const topStudied = [...mastery].sort((a, b) => b.done - a.done).slice(0, 3);
  const featured = recs[0];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {firstName ? `Olá, ${firstName}` : "Seu painel"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sua evolução, seus pontos fracos e o que estudar hoje.
        </p>
      </div>

      <OnboardingCard userId={user.id} />
      <AdaptivePlanCard userId={user.id} />
      <GamificationCard userId={user.id} />

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          value={`${overall.pct}%`}
          label="Progresso geral"
          hint={`${overall.done} de ${overall.total} conteúdos`}
        />
        <StatCard
          icon={CheckCircle2}
          value={String(overall.done)}
          label="Concluídos"
          hint={overall.done === 0 ? "Comece pela Biblioteca" : "conteúdos"}
        />
        <StatCard
          icon={Clock}
          value={fmtMinutes(stats.minutes7d)}
          label="Estudo (7 dias)"
          hint={`${fmtMinutes(stats.minutesToday)} hoje`}
        />
        <StatCard
          icon={Flame}
          value={`${stats.streak} ${stats.streak === 1 ? "dia" : "dias"}`}
          label="Sequência"
          hint={stats.streak > 0 ? "Continue assim" : "Estude hoje"}
        />
      </div>

      {/* recomendação do dia */}
      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Recomendação de estudo do dia
          </p>
          {featured ? (
            <Link
              href={featured.href}
              className="group mt-2 flex items-center gap-4"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-white">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {featured.title}
                </p>
                <p className="text-sm text-muted">{featured.reason}</p>
              </div>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Estude um conteúdo da Biblioteca para começar.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* domínio por matéria */}
        <Card>
          <CardHeader>
            <CardTitle>Domínio por matéria</CardTitle>
          </CardHeader>
          <CardBody>
            <SubjectMasteryList subjects={mastery} />
          </CardBody>
        </Card>

        {/* evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução do estudo</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-muted">
                Minutos por dia (30 dias) · total {fmtMinutes(stats.minutes30d)}
              </p>
              <Sparkline values={stats.series.map((d) => d.minutes)} />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Últimos 7 dias</p>
              <BarChart
                unit=""
                data={stats.series.slice(-7).map((d) => ({
                  label: new Date(d.day).toLocaleDateString("pt-BR", {
                    weekday: "short",
                  }),
                  value: d.minutes,
                }))}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* recomendações + pontos fracos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
          </CardHeader>
          <CardBody>
            {lim.smartRecommendations ? (
              <RecommendationsCard recs={recs} />
            ) : (
              <div className="space-y-3">
                <RecommendationsCard recs={recs.slice(0, 1)} />
                <PremiumLockCard
                  title="Recomendações inteligentes"
                  body="Revisões no momento certo, prática direcionada aos pontos fracos e sugestão de simulados."
                />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pontos fracos</CardTitle>
          </CardHeader>
          <CardBody>
            {lim.advancedAnalytics ? (
              <WeakSpotsCard weak={weak} />
            ) : (
              <PremiumLockCard
                title="Detecção de fraquezas"
                body="Matérias com menor domínio, conteúdos difíceis e o que está sem revisão há tempo demais."
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* mapa de desempenho (premium) */}
      {lim.advancedAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de desempenho (30 dias)</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <TrendingUp className="h-3 w-3" /> Mais estudadas
              </p>
              <ul className="space-y-1 text-sm">
                {topStudied.map((s) => (
                  <li
                    key={s.slug}
                    className="flex justify-between text-foreground"
                  >
                    <span>{s.name}</span>
                    <span className="text-muted">{s.done} concluídos</span>
                  </li>
                ))}
                {topStudied.length === 0 && (
                  <li className="text-muted">Sem dados ainda.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Uso da plataforma
              </p>
              <ul className="space-y-1 text-sm">
                {(Object.keys(counts) as ActivityKind[]).map((k) => (
                  <li key={k} className="flex justify-between text-foreground">
                    <span>{ACTIVITY_LABEL[k]}</span>
                    <span className="text-muted">{counts[k]}×</span>
                  </li>
                ))}
                {Object.keys(counts).length === 0 && (
                  <li className="text-muted">Sem atividade nos últimos 30 dias.</li>
                )}
              </ul>
            </div>
          </CardBody>
        </Card>
      )}

      {/* recentes + favoritos */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Atividade recente</CardTitle>
              <Link
                href="/historico"
                className="text-xs text-secondary hover:underline"
              >
                Ver histórico
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <ActivityTimeline items={recent} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Favoritos</CardTitle>
              <Link
                href="/favoritos"
                className="text-xs text-secondary hover:underline"
              >
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {favs.entries.length === 0 ? (
              <p className="text-sm text-muted">
                Nada favoritado ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {favs.entries.slice(0, 4).map((e) => (
                  <li key={e.category + e.id}>
                    <Link
                      href={e.href}
                      className="flex items-center gap-2 text-sm text-foreground hover:text-secondary"
                    >
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      <span className="truncate">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-center">
        <DonutProgress
          value={overall.pct}
          label={`${overall.pct}%`}
          sublabel="da biblioteca"
        />
      </div>
    </div>
  );
}
