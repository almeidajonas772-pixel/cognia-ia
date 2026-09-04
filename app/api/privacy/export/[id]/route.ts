import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { getExportDownloadUrl } from "@/lib/privacy/export";

export const dynamic = "force-dynamic";

/**
 * Fase 11 — download do pacote de exportação de dados. Verifica dono + validade
 * e redireciona para a URL assinada (curta) do bucket privado.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "export-dl", RATE_RULES.privacy, user.id);
  if (limited) return limited;

  const res = await getExportDownloadUrl(user.id, params.id);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 404 });
  return NextResponse.redirect(res.url);
}
