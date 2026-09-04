import type { Metadata } from "next";
import { getAnalytics } from "@/lib/analytics/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const a = await getAnalytics();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-semibold text-foreground">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Visitas (7d)" value={a.views7d} />
        <Kpi label="Visitas (30d)" value={a.views30d} />
        <Kpi label="Sessão média" value={`${a.avgSessionMin} min`} />
        <Kpi label="Retenção semanal" value={`${a.retention}%`} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <List title="Páginas mais acessadas" rows={a.topPages.map((p) => ({ k: p.path, v: p.count }))} />
        <List title="Origem dos acessos" rows={a.sources.map((s) => ({ k: s.source, v: s.count }))} />
        <List title="Conteúdos mais vistos" rows={a.topContent.map((c) => ({ k: c.label, v: c.count }))} />
      </div>

      <p className="text-xs text-muted">
        Integração com o Google Analytics: defina o ID em Configurações
        (também disponível via <code>NEXT_PUBLIC_GA_ID</code>).
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      </CardBody>
    </Card>
  );
}

function List({
  title,
  rows,
}: {
  title: string;
  rows: { k: string; v: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Sem dados ainda.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {rows.map((r) => (
              <li key={r.k} className="flex justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {r.k}
                </span>
                <span className="text-muted">{r.v}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
