import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { previewCoupon } from "@/lib/billing/coupons";
import { ConfirmSimulated } from "@/components/billing/ConfirmSimulated";

export const metadata: Metadata = { title: "Confirmar assinatura" };

export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: { cycle?: string; coupon?: string };
}) {
  const user = await requireUser();
  const cycle = searchParams.cycle === "anual" ? "anual" : "mensal";
  const coupon = (searchParams.coupon ?? "").trim();
  const preview = await previewCoupon(coupon, cycle, user.id);

  return (
    <div className="mx-auto max-w-md animate-fade-in space-y-5">
      <Link
        href="/precos"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Planos
      </Link>
      <h1 className="text-xl font-semibold text-foreground">
        Confirmar assinatura Premium
      </h1>
      <ConfirmSimulated cycle={cycle} coupon={coupon} preview={preview} />
    </div>
  );
}
