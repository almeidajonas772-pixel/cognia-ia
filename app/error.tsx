"use client";

import { useEffect } from "react";

/**
 * Fase 12 — Error boundary raiz. Mostra uma recuperação amigável e reporta
 * o erro (best-effort) para a telemetria do servidor.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    try {
      window.navigator.sendBeacon?.(
        "/api/observability/client-error",
        JSON.stringify({
          message: error.message,
          digest: error.digest,
          stack: error.stack?.split("\n").slice(0, 5).join("\n"),
          path: window.location.pathname,
        })
      );
    } catch {
      /* beacon é best-effort */
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted">
          Tivemos um problema ao carregar esta página. Você pode tentar de novo.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tentar novamente
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga total: recupera de estado quebrado do cliente */}
          <a
            href="/"
            className="h-9 rounded-lg border border-border px-4 text-sm leading-9 text-foreground hover:bg-white/5"
          >
            Ir para o início
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] text-muted">Ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
