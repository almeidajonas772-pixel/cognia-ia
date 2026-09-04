import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { getAiUsage } from "@/lib/observability/ai-usage";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart } from "@/components/progresso/Charts";

export const metadata: Metadata = { title: "Consumo de IA" };
export const dynamic = "force-dynamic";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n < 1 ? 4 : 2 });
const int = (n: number) => n.toLocaleString("pt-BR");

export default async function AdminUsagePage() {
  await requireAdmin();
  const u = await getAiUsage(30);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Consumo de IA</h1>
        <p className="text-sm text-muted">Últimos 30 dias · custo estimado (tabela de preços aproximada)</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Chamadas" value={int(u.totals.calls)} />
        <Metric label="Custo estimado" value={usd(u.totals.costUsd)} />
        <Metric label="Tokens (entrada)" value={int(u.totals.tokensIn)} />
        <Metric label="Tokens (saída)" value={int(u.totals.tokensOut)} />
      </div>
      {u.totals.errors > 0 && (
        <p className="text-sm text-amber-300">
          {int(u.totals.errors)} chamada(s) falharam no período.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custo por dia</CardTitle>
        </CardHeader>
        <CardBody>
          <BarChart
            data={u.daily.map((d) => ({
              label: d.day.slice(5),
              value: Math.round(d.costUsd * 10000) / 10000,
            }))}
          />
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por provedor</CardTitle>
          </CardHeader>
          <CardBody>
            <Table
              rows={u.byProvider.map((p) => [p.provider, int(p.calls), usd(p.costUsd)])}
              head={["Provedor", "Chamadas", "Custo"]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por funcionalidade</CardTitle>
          </CardHeader>
          <CardBody>
            <Table
              rows={u.byKind.map((k) => [k.kind, int(k.calls), usd(k.costUsd)])}
              head={["Tipo", "Chamadas", "Custo"]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários com maior consumo</CardTitle>
        </CardHeader>
        <CardBody>
          <Table
            rows={u.topUsers.map((t) => [
              t.email ?? t.userId.slice(0, 8),
              int(t.calls),
              usd(t.costUsd),
            ])}
            head={["Usuário", "Chamadas", "Custo"]}
            empty="Sem consumo atribuído a usuários no período."
          />
        </CardBody>
      </Card>

      <p className="text-xs text-muted">
        Os custos são estimativas a partir de contagem aproximada de tokens quando
        o provedor não retorna <code>usage</code>. Use como tendência, não como fatura.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      </CardBody>
    </Card>
  );
}

function Table({
  head,
  rows,
  empty = "Sem dados.",
}: {
  head: string[];
  rows: (string | number)[][];
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted">
        <tr>
          {head.map((h) => (
            <th key={h} className="pb-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            {r.map((c, j) => (
              <td key={j} className="py-2 text-foreground">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
