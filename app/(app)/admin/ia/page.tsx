import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/service";
import { getAiUsage } from "@/lib/observability/ai-usage";
import { DEFAULT_ROUTES } from "@/lib/ai/routing";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "IA" };
export const dynamic = "force-dynamic";

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n < 1 ? 4 : 2,
  });

export default async function AdminAiPage() {
  await requireAdmin();
  const db = createServiceClient();

  const [usage, routing, mem] = await Promise.all([
    getAiUsage(30),
    db.from("site_config").select("value").eq("key", "model_routing").maybeSingle(),
    db
      .from("chat_user_memory")
      .select("memory_version, last_evolved_at, interactions_since_evolve")
      .not("last_evolved_at", "is", null)
      .limit(5000),
  ]);

  const overrides = (routing.data?.value ?? {}) as Record<string, unknown>;
  const evolved = mem.data ?? [];
  const last24 = evolved.filter(
    (m) =>
      m.last_evolved_at &&
      Date.now() - new Date(m.last_evolved_at).getTime() < 86400_000
  ).length;
  const avgVersion = evolved.length
    ? (
        evolved.reduce((a, m) => a + (m.memory_version ?? 0), 0) / evolved.length
      ).toFixed(1)
    : "0";

  // custo por modelo (deriva de byProvider? melhor: agrega byKind não tem modelo)
  const byModel = new Map<string, { calls: number; cost: number }>();
  for (const p of usage.byProvider) {
    byModel.set(p.provider, { calls: p.calls, cost: p.costUsd });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">IA — roteamento e memória</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Chamadas (30d)" value={usage.totals.calls.toLocaleString("pt-BR")} />
        <Metric label="Custo estimado" value={usd(usage.totals.costUsd)} />
        <Metric label="Perfis evoluídos" value={String(evolved.length)} />
        <Metric label="Evoluções (24h)" value={String(last24)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roteamento de modelo</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <p className="text-muted">
            Padrões abaixo. Para sobrescrever, edite{" "}
            <code className="text-foreground">site_config.model_routing</code> (JSON
            por tarefa). Cache de 2 min.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="pb-2">Tarefa</th>
                  <th className="pb-2">Candidatos (ordem de capacidade)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DEFAULT_ROUTES).map(([task, cands]) => (
                  <tr key={task} className="border-t border-border align-top">
                    <td className="py-2 font-medium text-foreground">{task}</td>
                    <td className="py-2 text-muted">
                      {cands
                        .map((c) => `${c.model} (≥${c.minComplexity})`)
                        .join("  →  ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.keys(overrides).length > 0 && (
            <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-3 text-xs text-foreground">
              {JSON.stringify(overrides, null, 2)}
            </pre>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumo por provedor (30d)</CardTitle>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="pb-2">Provedor</th>
                <th className="pb-2">Chamadas</th>
                <th className="pb-2">Custo</th>
              </tr>
            </thead>
            <tbody>
              {[...byModel.entries()].map(([prov, v]) => (
                <tr key={prov} className="border-t border-border">
                  <td className="py-2 text-foreground">{prov}</td>
                  <td className="py-2 text-muted">{v.calls.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-muted">{usd(v.cost)}</td>
                </tr>
              ))}
              {byModel.size === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted">
                    Sem chamadas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memória evolutiva</CardTitle>
        </CardHeader>
        <CardBody className="text-sm text-muted">
          <p>
            {evolved.length} perfil(is) já passaram por evolução · versão média{" "}
            {avgVersion}. A evolução é disparada a cada ~15 interações de chat e
            pelo cron para perfis com mais de 7 dias.
          </p>
        </CardBody>
      </Card>
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
