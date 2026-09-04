"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { confirmSimulatedPayment } from "@/lib/billing/actions";
import type { CouponPreview } from "@/lib/billing/coupons";

/** Confirmação do "pagamento" quando o Mercado Pago não está configurado. */
export function ConfirmSimulated({
  cycle,
  coupon,
  preview,
}: {
  cycle: string;
  coupon: string;
  preview: CouponPreview;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const price = preview.valid ? preview.finalPrice : preview.basePrice;

  async function confirm() {
    setBusy(true);
    setErr(null);
    const res = await confirmSimulatedPayment({
      cycle,
      coupon: preview.valid ? preview.code : undefined,
    });
    if (!res.ok) {
      setErr("Não foi possível ativar. Tente novamente.");
      setBusy(false);
      return;
    }
    router.push("/perfil/assinatura");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-secondary">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Checkout (modo demonstração)
        </span>
      </div>
      <p className="text-sm text-muted">
        O Mercado Pago não está configurado neste ambiente. Confirme abaixo para
        ativar o Premium em modo demonstração.
      </p>

      <div className="rounded-lg bg-surface p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Plano Premium ({cycle})</span>
          <span className="text-foreground">
            R$ {preview.basePrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
        {preview.valid && (
          <div className="mt-1 flex justify-between text-emerald-400">
            <span>Cupom {preview.code}</span>
            <span>
              −{" "}
              {preview.discountPct
                ? `${preview.discountPct}%`
                : `R$ ${(preview.discountFixed ?? 0).toFixed(2).replace(".", ",")}`}
            </span>
          </div>
        )}
        {coupon && !preview.valid && (
          <p className="mt-1 text-xs text-amber-400">
            {preview.reason ?? "Cupom não aplicado."}
          </p>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span>R$ {price.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      {err && <p className="text-sm text-rose-400">{err}</p>}

      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Confirmar e ativar Premium
      </button>
    </div>
  );
}
