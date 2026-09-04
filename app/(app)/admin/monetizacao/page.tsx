import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { createClient } from "@/lib/supabase/server";
import { getFinanceStats } from "@/lib/billing/stats";
import { listCoupons } from "@/lib/billing/coupons";
import { getFreeLimits } from "@/lib/billing/entitlements";
import { getAdsConfig } from "@/lib/ads/server";
import { MonetizationView } from "@/components/admin/MonetizationView";
import { MonetizationTools } from "@/components/admin/MonetizationTools";

export const metadata: Metadata = { title: "Monetização" };

export default async function MonetizacaoPage() {
  const user = await requireUser();
  if (!(await isAppAdmin(user.id))) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 text-sm text-muted">Área restrita a administradores.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-secondary">
          Voltar
        </Link>
      </div>
    );
  }

  const supabase = createClient();
  const [stats, { data: payments }, coupons, limits, ads] = await Promise.all([
    getFinanceStats(),
    supabase
      .from("payments")
      .select("id, user_id, amount, status, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    listCoupons(),
    getFreeLimits(),
    getAdsConfig(),
  ]);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Painel de monetização
        </h1>
        <p className="mt-1 text-sm text-muted">
          Assinaturas, pagamentos, cupons, limites e anúncios.
        </p>
      </div>

      <MonetizationView stats={stats} payments={payments ?? []} />
      <MonetizationTools coupons={coupons} limits={limits} ads={ads} />
    </div>
  );
}
