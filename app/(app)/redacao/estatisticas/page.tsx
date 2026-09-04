import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, History } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { getEssayStats } from "@/lib/redacao/stats";
import { getErrorBank } from "@/lib/redacao/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sparkline } from "@/components/progresso/Charts";
import { PremiumGate } from "@/components/redacao/PremiumGate";

export const metadata: Metadata = { title: "Estatísticas de redação" };

export default async function RedacaoEstatisticasPage() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!canUseRedacao(profile)) return <PremiumGate />;

  const [stats, errorBank] = await Promise.all([
    getEssayStats(user.id),
    getErrorBank(user.id),
  ]);

  if (stats.totalCorrected === 0) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in space-y-5">
        <Back />
        <p className="text-sm text-muted">
          Corrija sua primeira redação para ver a evolução aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <Back />
      <h1 className="text-xl font-semibold text-foreground">
        Estatísticas e evolução
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat value={String(stats.totalCorrected)} label="Corrigidas" />
        <Stat value={`${stats.averagePct}%`} label="Média geral" />
        <Stat value={`${stats.bestPct}%`} label="Melhor" />
        <Stat
          value={stats.evolution.length > 1 ? `${stats.evolution.at(-1)!.pct}%` : "—"}
          label="Última"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução da nota (%)</CardTitle>
        </CardHeader>
        <CardBody>
          <Sparkline values={stats.evolution.map((e) => e.pct)} />
          <p className="mt-1 text-xs text-muted">
            {stats.evolution.length} correções · da mais antiga à mais recente
          </p>
        </CardBody>
      </Card>

      {stats.perCompetency.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Média por competência (ENEM)</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {stats.perCompetency.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted">{c.avgPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${c.avgPct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              {stats.strongest && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3 w-3" /> Mais forte: {stats.strongest}
                </span>
              )}
              {stats.weakest && (
                <span className="flex items-center gap-1 text-rose-400">
                  <TrendingDown className="h-3 w-3" /> Mais fraca: {stats.weakest}
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Banco de erros recorrentes</CardTitle>
        </CardHeader>
        <CardBody>
          {errorBank.length === 0 ? (
            <p className="text-sm text-muted">Nenhum erro recorrente registrado.</p>
          ) : (
            <ul className="space-y-2">
              {errorBank.slice(0, 10).map((e) => (
                <li
                  key={e.signature}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {e.label}
                    {e.category && (
                      <span className="ml-2 text-xs text-muted">{e.category}</span>
                    )}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-amber-400">
                    <History className="h-3 w-3" />
                    {e.occurrences}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/redacao"
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
    >
      <ChevronLeft className="h-3 w-3" />
      Redação
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </CardBody>
    </Card>
  );
}
