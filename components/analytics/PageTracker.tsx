"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Envia uma visita de página ao servidor a cada navegação (spec §13). */
export function PageTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    const device =
      typeof window !== "undefined" && window.innerWidth < 768
        ? "mobile"
        : "desktop";
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        device,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
