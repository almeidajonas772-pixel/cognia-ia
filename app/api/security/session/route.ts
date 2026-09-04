import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSession } from "@/lib/security/sessions";
import { logSecurityFromRequest } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * Fase 11 — registra a sessão/dispositivo atual. Chamado uma vez por aba pelo
 * <SessionSync/>. Também serve como ponto de auditoria de "login" (primeira vez
 * que a aba registra a sessão).
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    await registerSession({
      userId: user.id,
      accessToken: session?.access_token ?? null,
      headers: req.headers,
    });
    await logSecurityFromRequest(req, "session_registered", { userId: user.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
