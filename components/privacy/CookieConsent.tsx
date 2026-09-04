"use client";

import { useEffect, useState } from "react";

/**
 * Fase 11 — Banner de consentimento de cookies (LGPD art. 8º).
 * Aparece até o visitante decidir. Grava via /api/privacy/consent (cookie +
 * user_consent quando logado) e dispara um evento para o gate de analytics.
 */

const COOKIE = "cogni_consent";

function hasDecided(): boolean {
  try {
    if (document.cookie.split("; ").some((c) => c.startsWith(COOKIE + "="))) return true;
    return !!localStorage.getItem(COOKIE + "_seen");
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasDecided()) setOpen(true);
  }, []);

  async function decide(next: { analytics: boolean; marketing: boolean }) {
    setSaving(true);
    try {
      await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      try {
        localStorage.setItem(COOKIE + "_seen", "1");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent("cogni:consent", { detail: next }));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-4xl p-4 text-sm">
        <p className="text-foreground">
          Usamos cookies essenciais para o funcionamento do site e, com seu
          consentimento, cookies de análise para melhorar a experiência. Veja a{" "}
          <a href="/privacidade" className="text-secondary underline">
            Política de Privacidade
          </a>
          .
        </p>

        {custom && (
          <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" checked disabled />
              Essenciais (sempre ativos)
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
              Marketing
            </label>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => decide({ analytics: false, marketing: false })}
            className="h-9 rounded-lg border border-border px-3 text-foreground hover:bg-white/5 disabled:opacity-60"
          >
            Só essenciais
          </button>
          {custom ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => decide({ analytics, marketing })}
              className="h-9 rounded-lg bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              Salvar escolha
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => setCustom(true)}
                className="h-9 rounded-lg border border-border px-3 text-foreground hover:bg-white/5 disabled:opacity-60"
              >
                Personalizar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => decide({ analytics: true, marketing: false })}
                className="h-9 rounded-lg bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                Aceitar análise
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
