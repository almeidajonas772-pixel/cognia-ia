"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  cancelMySubscription,
  changePlan,
  confirmSimulatedPayment,
} from "@/lib/billing/actions";

export function CancelButton({ periodEnd }: { periodEnd: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-xs text-muted">
        Assinatura cancelada. O acesso Premium continua até{" "}
        {periodEnd
          ? new Date(periodEnd).toLocaleDateString("pt-BR")
          : "o fim do período"}
        .
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancelar a renovação automática?")) return;
        start(async () => {
          await cancelMySubscription();
          setDone(true);
          router.refresh();
        });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Cancelar assinatura
    </button>
  );
}

export function ChangePlanButton({ current }: { current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const target = current === "anual" ? "mensal" : "anual";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await changePlan(target);
          router.refresh();
        })
      }
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-white/5 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Mudar para plano {target}
    </button>
  );
}

export function RenewNowButton({ cycle }: { cycle: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmSimulatedPayment({ cycle });
          router.refresh();
        })
      }
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Renovar agora
    </button>
  );
}
