import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { getHealth } from "@/lib/observability/health";
import { listLogs } from "@/lib/observability/log";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Saúde do sistema" };
export const dynamic = "force-dynamic";

const DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  degradado: "bg-amber-400",
  erro: "bg-rose-500",
  "n/d": "bg-white/25",
};

export default async function AdminHealthPage() {
  await requireAdmin();
  const [health, errors] = await Promise.all([
    getHealth(),
    listLogs({ level: "error", limit: 25 }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${DOT[health.overall]}`} />
        <h1 className="text-xl font-semibold text-foreground">Saúde do sistema</h1>
        <span className="text-xs text-muted">
          {new Date(health.generatedAt).toLocaleString("pt-BR")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {health.checks.map((c) => (
          <Card key={c.name}>
            <CardBody className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.status]}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted">{c.detail}</p>
                {typeof c.latencyMs === "number" && (
                  <p className="mt-0.5 text-[11px] text-muted">{c.latencyMs} ms</p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de processamento</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-foreground">{health.queue.queued}</p>
            <p className="text-xs text-muted">na fila</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{health.queue.running}</p>
            <p className="text-xs text-muted">rodando</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{health.queue.error}</p>
            <p className="text-xs text-muted">com erro</p>
          </div>
          {health.queue.oldestQueuedMin !== null && (
            <p className="col-span-3 text-xs text-muted">
              Job mais antigo aguardando há {health.queue.oldestQueuedMin} min.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos erros no log</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {errors.length === 0 && (
            <p className="text-sm text-muted">Nenhum erro registrado recentemente. 🎉</p>
          )}
          {errors.map((l) => (
            <div key={l.id} className="border-b border-border pb-2 text-sm last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-rose-400">{l.source}</span>
                <span className="text-[11px] text-muted">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-muted">{l.message}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <p className="text-xs text-muted">
        As checagens rodam a cada carregamento desta página. Para monitoramento
        contínuo, aponte um serviço de uptime para <code>/api/cron</code> (com o
        header <code>Authorization: Bearer CRON_SECRET</code>).
      </p>
    </div>
  );
}
