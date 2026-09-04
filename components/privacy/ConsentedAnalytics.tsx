"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

/**
 * Fase 11 — só carrega o Google Analytics se houver consentimento de análise
 * (cookie `cogni_consent`). Reage à decisão do banner sem recarregar a página.
 */
export function ConsentedAnalytics({ id }: { id: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = document.cookie
          .split("; ")
          .find((c) => c.startsWith("cogni_consent="))
          ?.split("=")
          .slice(1)
          .join("=");
        if (!raw) return setAllowed(false);
        const parsed = JSON.parse(decodeURIComponent(raw)) as { analytics?: boolean };
        setAllowed(!!parsed.analytics);
      } catch {
        setAllowed(false);
      }
    };
    read();
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<{ analytics?: boolean }>).detail;
      setAllowed(!!detail?.analytics);
    };
    window.addEventListener("cogni:consent", onConsent);
    return () => window.removeEventListener("cogni:consent", onConsent);
  }, []);

  if (!id || !allowed) return null;
  return <GoogleAnalytics id={id} />;
}
