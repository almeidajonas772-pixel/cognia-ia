import type { Metadata } from "next";
import Link from "next/link";
import { PenLine, Plus, BarChart3 } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { listEssays } from "@/lib/redacao/queries";
import { getEssayStats } from "@/lib/redacao/stats";
import { Card, CardBody } from "@/components/ui/Card";
import { PremiumGate } from "@/components/redacao/PremiumGate";
import { EssayList } from "@/components/redacao/EssayList";

export const metadata: Metadata = { title: "Redação" };

export default async function RedacaoPage() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!canUseRedacao(profile)) return <PremiumGate />;

  const [essays, stats] = await Promise.all([
    listEssays(user.id),
    getEssayStats(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Redação</h1>
            <p className="mt-1 text-sm text-muted">
              Correção no rigor da banca, com nota por competência e plano de
              melhoria.
            </p>
          </div>
        </div>
        <Link
          href="/redacao/nova"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Nova redação
        </Link>
      </div>

      {stats.totalCorrected > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <MiniStat value={String(stats.totalCorrected)} label="Corrigidas" />
          <MiniStat value={`${stats.averagePct}%`} label="Média geral" />
          <MiniStat value={`${stats.bestPct}%`} label="Melhor nota" />
        </div>
      )}

      {stats.totalCorrected > 0 && (
        <Link
          href="/redacao/estatisticas"
          className="flex items-center gap-2 text-sm text-secondary hover:underline"
        >
          <BarChart3 className="h-4 w-4" />
          Ver estatísticas e evolução
        </Link>
      )}

      <Card>
        <CardBody>
          <EssayList essays={essays} />
        </CardBody>
      </Card>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </CardBody>
    </Card>
  );
}
