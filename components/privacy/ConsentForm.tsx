"use client";

import { useState, useTransition } from "react";
import { saveConsentAction } from "@/lib/privacy/actions";

export function ConsentForm({
  initial,
}: {
  initial: { analytics: boolean; marketing: boolean };
}) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [marketing, setMarketing] = useState(initial.marketing);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    start(async () => {
      await saveConsentAction({ analytics, marketing });
      // espelha no cookie para o gate de analytics
      try {
        await fetch("/api/privacy/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analytics, marketing }),
        });
        window.dispatchEvent(
          new CustomEvent("cogni:consent", { detail: { analytics, marketing } })
        );
      } catch {
        /* ignore */
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3 text-sm">
      <label className="flex items-center gap-2 text-muted">
        <input type="checkbox" checked disabled /> Cookies essenciais (sempre ativos)
      </label>
      <label className="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          checked={analytics}
          onChange={(e) => setAnalytics(e.target.checked)}
        />
        Análise de uso (Google Analytics)
      </label>
      <label className="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          checked={marketing}
          onChange={(e) => setMarketing(e.target.checked)}
        />
        Comunicações de marketing
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar preferências"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Preferências salvas.</span>}
      </div>
    </div>
  );
}
