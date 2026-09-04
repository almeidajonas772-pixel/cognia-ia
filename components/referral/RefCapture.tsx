"use client";

import { useEffect } from "react";

/**
 * Fase 14 — captura o `?ref=CODE` da URL e guarda no cookie `cogni_ref`
 * (30 dias). O vínculo real é criado no onboarding (`redeemReferralOnSignup`).
 */
export function RefCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("ref");
      if (!code || !/^[A-Za-z0-9]{4,16}$/.test(code)) return;
      if (document.cookie.includes("cogni_ref=")) return;
      document.cookie = `cogni_ref=${encodeURIComponent(
        code
      )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    } catch {
      /* ignora */
    }
  }, []);
  return null;
}
