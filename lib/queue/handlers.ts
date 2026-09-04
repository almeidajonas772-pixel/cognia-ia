import { registerHandler } from "@/lib/queue";
import { runCorrection } from "@/lib/redacao/correct";
import { runDataExport } from "@/lib/privacy/export";
import { evolveMemory } from "@/lib/ai/memory-evolve";
import { createServiceClient } from "@/lib/supabase/service";
import type { createClient } from "@/lib/supabase/server";

/**
 * Fase 10 — Registro central de handlers de job.
 *
 * Importe este módulo em qualquer rota que rode a fila (`/api/jobs/run`,
 * `/api/cron`) — o import executa os `registerHandler` abaixo. Cada handler é
 * uma função pura de `payload → resultado`; erros propagados são reprogramados
 * com backoff pela `processJobs`.
 */

registerHandler("essay_correction", async (payload, ctx) => {
  const userId = String(payload.userId ?? "");
  const essayId = String(payload.essayId ?? "");
  if (!userId || !essayId) throw new Error("payload inválido (userId/essayId)");

  await ctx.setProgress(10);
  // service role: sem sessão de usuário no worker, o RLS de essay_submissions
  // exige um cliente privilegiado.
  const db = createServiceClient() as unknown as ReturnType<typeof createClient>;
  const res = await runCorrection(userId, essayId, db);
  await ctx.setProgress(100);

  if (!res.ok) throw new Error(res.error ?? "falha na correção");
  return { essayId, notAnEssay: res.notAnEssay ?? false };
});

registerHandler("data_export", async (payload, ctx) => {
  const userId = String(payload.userId ?? "");
  const exportId = String(payload.exportId ?? "");
  if (!userId || !exportId) throw new Error("payload inválido (userId/exportId)");

  await ctx.setProgress(15);
  await runDataExport(userId, exportId);
  await ctx.setProgress(100);
  return { exportId };
});

registerHandler("memory_evolution", async (payload, ctx) => {
  const userId = String(payload.userId ?? "");
  if (!userId) throw new Error("payload inválido (userId)");

  await ctx.setProgress(20);
  const res = await evolveMemory(userId, ctx.db);
  await ctx.setProgress(100);
  return { userId, ...res };
});
