"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Fase 12 — Error boundary da área logada. Mantém o usuário dentro do app.
 */
export default function AppError({
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
          path: window.location.pathname,
          area: "app",
        })
      );
    } catch {
      /* best-effort */
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Esta página não pôde ser carregada
      </h1>
      <p className="mt-2 text-sm text-muted">
        Foi um problema temporário. Tente recarregar — seus dados estão a salvo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
      >
        <RefreshCw className="h-4 w-4" />
        Recarregar
      </button>
    </div>
  );
}
