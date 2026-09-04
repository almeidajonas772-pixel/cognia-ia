/**
 * Next.js instrumentation hook (roda uma vez no boot do servidor).
 * Fase 12 — imprime o relatório de variáveis de ambiente.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvReportOnce } = await import("@/lib/env");
    logEnvReportOnce();
  }
}
