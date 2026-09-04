import { createClient } from "@/lib/supabase/server";

export type FinanceStats = {
  activeSubs: number;
  cancelledSubs: number;
  expiredSubs: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  mrr: number;
  arr: number;
  newSubs30d: number;
  churnRate: number;
  ticketMedio: number;
  conversionRate: number;
  approved: number;
  rejected: number;
  pending: number;
  refunded: number;
  monthlySeries: { month: string; revenue: number }[];
};

const DAY = 86_400_000;

export async function getFinanceStats(): Promise<FinanceStats> {
  const supabase = createClient();
  const [{ data: subs }, { data: payments }, { count: totalUsers }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, cycle, price, current_period_end, started_at, cancel_at_period_end"),
      supabase
        .from("payments")
        .select("amount, status, created_at")
        .order("created_at", { ascending: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ]);

  const S = subs ?? [];
  const P = payments ?? [];
  const now = Date.now();

  const active = S.filter((s) => s.status === "active");
  const activeSubs = active.length;
  const cancelledSubs = S.filter((s) => s.cancel_at_period_end).length;
  const expiredSubs = S.filter((s) => s.status === "expired").length;

  const approved = P.filter((p) => p.status === "approved");
  const sumSince = (ms: number) =>
    approved
      .filter((p) => now - new Date(p.created_at).getTime() <= ms)
      .reduce((a, p) => a + Number(p.amount), 0);

  const revenueToday = sumSince(DAY);
  const revenueWeek = sumSince(7 * DAY);
  const revenueMonth = sumSince(30 * DAY);
  const revenueYear = sumSince(365 * DAY);

  // MRR: soma normalizada mensal das assinaturas ativas
  const mrr = active.reduce(
    (a, s) => a + (s.cycle === "anual" ? Number(s.price) / 12 : Number(s.price)),
    0
  );
  const arr = mrr * 12;

  const newSubs30d = S.filter(
    (s) => now - new Date(s.started_at).getTime() <= 30 * DAY
  ).length;

  const everSubscribed = S.length;
  const churnRate = everSubscribed
    ? Math.round(((cancelledSubs + expiredSubs) / everSubscribed) * 100)
    : 0;
  const ticketMedio = approved.length
    ? Math.round((approved.reduce((a, p) => a + Number(p.amount), 0) / approved.length) * 100) / 100
    : 0;
  const conversionRate = totalUsers
    ? Math.round((activeSubs / totalUsers) * 1000) / 10
    : 0;

  // série mensal (últimos 6 meses)
  const monthly = new Map<string, number>();
  for (const p of approved) {
    const k = p.created_at.slice(0, 7);
    monthly.set(k, (monthly.get(k) ?? 0) + Number(p.amount));
  }
  const monthlySeries: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now - i * 30 * DAY);
    const k = d.toISOString().slice(0, 7);
    monthlySeries.push({
      month: d.toLocaleDateString("pt-BR", { month: "short" }),
      revenue: Math.round(monthly.get(k) ?? 0),
    });
  }

  return {
    activeSubs,
    cancelledSubs,
    expiredSubs,
    revenueToday: round2(revenueToday),
    revenueWeek: round2(revenueWeek),
    revenueMonth: round2(revenueMonth),
    revenueYear: round2(revenueYear),
    mrr: round2(mrr),
    arr: round2(arr),
    newSubs30d,
    churnRate,
    ticketMedio,
    conversionRate,
    approved: approved.length,
    rejected: P.filter((p) => p.status === "rejected").length,
    pending: P.filter((p) => p.status === "pending" || p.status === "in_process").length,
    refunded: P.filter((p) => p.status === "refunded").length,
    monthlySeries,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
