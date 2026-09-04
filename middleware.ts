import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { fetchLaunchMode } from "@/lib/launch";

/** Caminhos sempre liberados, mesmo em manutenção (admin liga/desliga o modo). */
const MAINTENANCE_ALLOW = [
  "/manutencao",
  "/admin",
  "/login",
  "/auth",
  "/api",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fase 13 — modo de manutenção (site_config.launch). Fail-open.
  if (!MAINTENANCE_ALLOW.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    try {
      if ((await fetchLaunchMode()) === "maintenance") {
        const url = request.nextUrl.clone();
        url.pathname = "/manutencao";
        url.search = "";
        return NextResponse.rewrite(url);
      }
    } catch {
      /* nunca bloqueia por falha na checagem */
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto:
     * - _next/static, _next/image
     * - favicon e arquivos de imagem
     * - /auth/callback (troca o code pela sessão sem interferência)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
