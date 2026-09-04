import type { Metadata } from "next";
import { listAdminLogs } from "@/lib/admin/logs";

export const metadata: Metadata = { title: "Logs" };

export default async function AdminLogsPage() {
  const logs = await listAdminLogs(150);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        Logs administrativos
      </h1>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3">Quando</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Alvo</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3 text-xs text-muted">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="p-3 text-foreground">{l.action}</td>
                <td className="p-3 text-xs text-muted">
                  {l.target_type}
                  {l.target_id ? ` · ${l.target_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted">
                  Nenhum registro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
