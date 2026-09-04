import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Registra uma visita de página (spec §13). Funciona para visitante e logado. */
export async function POST(req: Request) {
  let body: { path?: string; referrer?: string; device?: string; duration?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.path) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const supabase = createClient();
    await supabase.rpc("track_page_view", {
      p_path: body.path.slice(0, 300),
      p_referrer: body.referrer ? body.referrer.slice(0, 300) : null,
      p_device: body.device ?? null,
      p_duration_ms: body.duration ?? null,
    });
  } catch {
    /* silencioso */
  }
  return NextResponse.json({ ok: true });
}
