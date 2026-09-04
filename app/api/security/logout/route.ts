import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logSecurityFromRequest } from "@/lib/security/audit";
import { touchSession } from "@/lib/security/sessions";

export const dynamic = "force-dynamic";

/** Fase 11 — registra o logout na trilha de auditoria (best-effort). */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    await touchSession(user.id, session?.access_token ?? null);
    await logSecurityFromRequest(req, "logout", { userId: user.id });
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
