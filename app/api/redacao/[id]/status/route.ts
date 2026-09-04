import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Fase 10 — Status da correção para polling do cliente.
 * Combina o estado do job na fila com o `status` persistido da redação
 * (fonte da verdade quando o job já terminou ou foi processado por outro worker).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient();

  const { data: essay } = await supabase
    .from("essay_submissions")
    .select("status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!essay) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: job } = await supabase
    .from("jobs")
    .select("status, progress, error, attempts, max_attempts")
    .eq("type", "essay_correction")
    .eq("user_id", user.id)
    .contains("payload", { essayId: params.id })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const done = essay.status === "corrigida" || essay.status === "erro";
  const failed =
    essay.status === "erro" ||
    (job?.status === "error" && (job?.attempts ?? 0) >= (job?.max_attempts ?? 3));

  return NextResponse.json({
    essayStatus: essay.status,
    jobStatus: job?.status ?? (done ? "done" : "queued"),
    progress: done ? 100 : job?.progress ?? 0,
    done,
    failed,
    error: job?.error ?? null,
  });
}
