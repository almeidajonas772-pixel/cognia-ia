"use client";

import { useEffect } from "react";

/**
 * Fase 11 — registra/atualiza a sessão atual (dispositivo) uma vez por aba.
 * Fire-and-forget: falhas são silenciosas e não afetam a navegação.
 */
export function SessionSync() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cogni_sess_synced")) return;
      sessionStorage.setItem("cogni_sess_synced", "1");
    } catch {
      /* modo privado / storage bloqueado — segue mesmo assim */
    }
    fetch("/api/security/session", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
