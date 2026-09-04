import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSession } from "@/lib/security/sessions";
import { logSecurityFromRequest } from "@/lib/security/audit";

/**
 * Destino de retorno do OAuth (Google/Apple), da confirmação de e-mail e do
 * link de redefinição de senha. Troca o `code` PKCE pela sessão e redireciona.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // trilha de segurança + registro do dispositivo (best-effort)
      try {
        const userId = data.user?.id;
        if (userId) {
          await registerSession({
            userId,
            accessToken: data.session?.access_token ?? null,
            headers: request.headers,
          });
          await logSecurityFromRequest(request, "login", {
            userId,
            email: data.user?.email ?? null,
            meta: { method: "oauth_or_link" },
          });
        }
      } catch {
        /* não bloquear o login */
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Não foi possível concluir a autenticação. Tente novamente."
    )}`
  );
}
