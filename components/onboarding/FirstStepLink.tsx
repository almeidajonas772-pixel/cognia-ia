"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { markFirstStep } from "@/lib/onboarding/actions";

/**
 * Fase 13 — item da checklist de primeiros passos. Marca o passo como feito
 * (best-effort) e navega para a rota correspondente.
 */
export function FirstStepLink({
  id,
  label,
  href,
  done,
}: {
  id: string;
  label: string;
  href: string;
  done: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!done) start(() => void markFirstStep(id));
        router.push(href);
      }}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted hover:bg-white/5 hover:text-foreground"
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Circle className="h-4 w-4 shrink-0" />
      )}
      <span className={done ? "line-through" : ""}>{label}</span>
    </button>
  );
}
