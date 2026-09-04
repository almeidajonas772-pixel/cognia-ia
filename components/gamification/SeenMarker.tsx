"use client";

import { useEffect, useRef } from "react";
import { markAchievementsSeen } from "@/lib/gamification/actions";

/** Fase 14 — marca as conquistas novas como vistas ao abrir a página. */
export function SeenMarker({ pending }: { pending: number }) {
  const ran = useRef(false);
  useEffect(() => {
    if (pending > 0 && !ran.current) {
      ran.current = true;
      void markAchievementsSeen();
    }
  }, [pending]);
  return null;
}
