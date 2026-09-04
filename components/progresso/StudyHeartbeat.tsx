"use client";

import { useEffect } from "react";
import { ACHIEVEMENT_MAP } from "@/lib/gamification/achievements";

const INTERVAL = 60_000;

/**
 * Enquanto alguma página do app estiver aberta e visível, envia um ping a cada
 * minuto para o servidor contabilizar o tempo de estudo. Montado uma vez no
 * layout do app. Também dispara o toast de conquista quando o ping retorna
 * `unlocked` (Fase 14).
 */
export function StudyHeartbeat() {
  useEffect(() => {
    let stopped = false;

    const ping = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/study/ping", { method: "POST", keepalive: true });
        const data = (await res.json()) as { unlocked?: string[] };
        const items = (data.unlocked ?? [])
          .map((id) => ACHIEVEMENT_MAP[id])
          .filter(Boolean)
          .map((a) => ({ id: a.id, name: a.name }));
        if (items.length) {
          window.dispatchEvent(new CustomEvent("cogni:achievement", { detail: items }));
        }
      } catch {
        /* ignora */
      }
    };

    ping();
    const timer = setInterval(ping, INTERVAL);
    document.addEventListener("visibilitychange", ping);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
