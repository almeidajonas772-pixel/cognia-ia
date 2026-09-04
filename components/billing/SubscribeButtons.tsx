"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tag } from "lucide-react";
import { PRICES } from "@/lib/billing/config";
import { cn } from "@/lib/utils";

/**
 * Escolha de ciclo + cupom + iniciar checkout (spec §3, §4.1).
 * `loggedIn=false` → manda para /login antes.
 */
export function SubscribeButtons({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [cycle, setCycle] = useState<"mensal" | "anual">("anual");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!loggedIn) {
      router.push("/cadastro?next=/precos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle, coupon: coupon.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      if (data.url.startsWith("/")) router.push(data.url);
      else window.location.href = data.url;
    } catch {
      setErr("Não foi possível iniciar o checkout. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <CycleCard
          active={cycle === "mensal"}
          onClick={() => setCycle("mensal")}
          title="Mensal"
          price={PRICES.mensal.label}
        />
        <CycleCard
          active={cycle === "anual"}
          onClick={() => setCycle("anual")}
          title="Anual"
          price={PRICES.anual.label}
          note="≈ R$ 9,99/mês · economize ~33%"
        />
      </div>

      <div className="relative">
        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="Cupom de desconto (opcional)"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      </div>

      {err && <p className="text-sm text-rose-400">{err}</p>}

      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {loggedIn ? "Assinar Premium" : "Criar conta e assinar"}
      </button>
      <p className="text-center text-[11px] text-muted">
        Renovação automática · cancele quando quiser
      </p>
    </div>
  );
}

function CycleCard({
  active,
  onClick,
  title,
  price,
  note,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary-soft"
          : "border-border hover:border-primary/40"
      )}
    >
      <p className="text-xs text-muted">{title}</p>
      <p className="text-sm font-semibold text-foreground">{price}</p>
      {note && <p className="mt-0.5 text-[11px] text-secondary">{note}</p>}
    </button>
  );
}
