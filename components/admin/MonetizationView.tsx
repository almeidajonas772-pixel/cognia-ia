import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart } from "@/components/progresso/Charts";
import type { FinanceStats } from "@/lib/billing/stats";

const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export function MonetizationView({
  stats,
  payments,
}: {
  stats: FinanceStats;
  payments: {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    provider: string;
    created_at: string;
  }[];
}) {
  return (
    <div className="space-y-6">
      {/* dashboard financeiro (spec §11) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Receita hoje" value={brl(stats.revenueToday)} />
        <Kpi label="Receita mês" value={brl(stats.revenueMonth)} />
        <Kpi label="MRR" value={brl(stats.mrr)} />
        <Kpi label="ARR" value={brl(stats.arr)} />
        <Kpi label="Assinantes ativos" value={String(stats.activeSubs)} />
        <Kpi label="Novos (30d)" value={String(stats.newSubs30d)} />
        <Kpi label="Conversão" value={`${stats.conversionRate}%`} />
        <Kpi label="Churn" value={`${stats.churnRate}%`} />
        <Kpi label="Ticket médio" value={brl(stats.ticketMedio)} />
        <Kpi label="Receita semana" value={brl(stats.revenueWeek)} />
        <Kpi label="Receita ano" value={brl(stats.revenueYear)} />
        <Kpi label="Cancel. agendados" value={String(stats.cancelledSubs)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receita mensal (6 meses)</CardTitle>
        </CardHeader>
        <CardBody>
          <BarChart
            data={stats.monthlySeries.map((m) => ({
              label: m.month,
              value: m.revenue,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
            <span className="text-emerald-400">{stats.approved} aprovados</span>
            <span className="text-rose-400">{stats.rejected} recusados</span>
            <span>{stats.pending} pendentes</span>
            <span>{stats.refunded} estornos</span>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">Nenhum pagamento ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="py-1">Data</th>
                    <th className="py-1">Usuário</th>
                    <th className="py-1">Valor</th>
                    <th className="py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-1.5 text-muted">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-1.5 font-mono text-xs text-muted">
                        {p.user_id.slice(0, 8)}
                      </td>
                      <td className="py-1.5 text-foreground">{brl(p.amount)}</td>
                      <td className="py-1.5">
                        <span
                          className={
                            p.status === "approved"
                              ? "text-emerald-400"
                              : p.status === "rejected"
                                ? "text-rose-400"
                                : "text-muted"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      </CardBody>
    </Card>
  );
}
