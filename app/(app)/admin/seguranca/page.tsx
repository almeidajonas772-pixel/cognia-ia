import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/service";
import { listRecentSecurityEvents } from "@/lib/security/audit";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Segurança" };
export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  await requireAdmin();
  const db = createServiceClient();

  const [events, deletions, exports_, rateHits] = await Promise.all([
    listRecentSecurityEvents({ limit: 100 }),
    db
      .from("user_security")
      .select("user_id, deletion_requested_at, deletion_scheduled_for")
      .not("deletion_scheduled_for", "is", null)
      .order("deletion_scheduled_for", { ascending: true })
      .limit(50),
    db
      .from("data_exports")
      .select("id, user_id, status, requested_at")
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: true })
      .limit(50),
    db
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("event", "rate_limited")
      .gte("created_at", new Date(Date.now() - 86400_000).toISOString()),
  ]);

  const pendingDeletions = deletions.data ?? [];
  const pendingExports = exports_.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Segurança & privacidade</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Rate limit (24h)" value={rateHits.count ?? 0} />
        <Metric label="Exclusões agendadas" value={pendingDeletions.length} />
        <Metric label="Exportações na fila" value={pendingExports.length} />
        <Metric
          label="Eventos (janela)"
          value={events.length}
        />
      </div>

      {pendingDeletions.length > 0 && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle>Exclusões de conta agendadas</CardTitle>
          </CardHeader>
          <CardBody className="space-y-1 text-sm">
            {pendingDeletions.map((d) => (
              <div key={d.user_id} className="flex justify-between border-b border-border pb-1 last:border-0">
                <span className="text-muted">{d.user_id.slice(0, 8)}…</span>
                <span className="text-foreground">
                  {d.deletion_scheduled_for
                    ? new Date(d.deletion_scheduled_for).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Eventos de segurança recentes</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="pb-2">Quando</th>
                  <th className="pb-2">Evento</th>
                  <th className="pb-2">Usuário</th>
                  <th className="pb-2">IP (hash)</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="py-2 text-xs text-muted">
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 text-foreground">{e.event}</td>
                    <td className="py-2 text-xs text-muted">
                      {e.user_id ? e.user_id.slice(0, 8) + "…" : e.email ?? "—"}
                    </td>
                    <td className="py-2 text-xs text-muted">
                      {e.ip_hash ? e.ip_hash.slice(0, 10) + "…" : "—"}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted">
                      Nenhum evento registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {value.toLocaleString("pt-BR")}
        </p>
      </CardBody>
    </Card>
  );
}
