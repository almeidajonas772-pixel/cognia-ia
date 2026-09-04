"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelDeletionAction } from "@/lib/privacy/actions";

export function CancelDeletionButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await cancelDeletionAction();
            if (res.ok) router.refresh();
            else setErr(res.error ?? "Não foi possível cancelar.");
          })
        }
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar exclusão da conta"}
      </button>
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
    </div>
  );
}
