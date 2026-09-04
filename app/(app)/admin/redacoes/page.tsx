import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Redações" };

export default async function AdminRedacoesPage() {
  const supabase = createClient();
  const HEAD = { count: "exact" as const, head: true as const };
  const [total, corrigidas, { data: recent }, { data: byBanca }] =
    await Promise.all([
      supabase.from("essay_submissions").select("id", HEAD),
      supabase
        .from("essay_submissions")
        .select("id", HEAD)
        .eq("status", "corrigida"),
      supabase
        .from("essay_submissions")
        .select("id, title, banca, grade, grade_max, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("essay_submissions")
        .select("banca")
        .eq("status", "corrigida"),
    ]);

  const bancaCount = new Map<string, number>();
  for (const r of byBanca ?? [])
    bancaCount.set(r.banca, (bancaCount.get(r.banca) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-semibold text-foreground">Redações</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Total enviadas</p>
            <p className="text-xl font-semibold text-foreground">
              {total.count ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Corrigidas</p>
            <p className="text-xl font-semibold text-foreground">
              {corrigidas.count ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Bancas usadas</p>
            <p className="text-xl font-semibold text-foreground">
              {bancaCount.size}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Uso por banca
          </p>
          <ul className="space-y-1 text-sm">
            {[...bancaCount.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([b, c]) => (
                <li key={b} className="flex justify-between text-foreground">
                  <span>{b}</span>
                  <span className="text-muted">{c}</span>
                </li>
              ))}
            {bancaCount.size === 0 && (
              <li className="text-muted">Sem correções ainda.</li>
            )}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Últimas redações
          </p>
          <ul className="divide-y divide-border text-sm">
            {(recent ?? []).map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {r.title}
                </span>
                <span className="text-xs text-muted">
                  {r.banca} ·{" "}
                  {r.status === "corrigida" && r.grade != null
                    ? `${r.grade}/${r.grade_max}`
                    : r.status}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
