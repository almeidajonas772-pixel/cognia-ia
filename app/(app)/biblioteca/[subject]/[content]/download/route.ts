import { getProfile } from "@/lib/auth";
import { getContentView, getPremiumBody } from "@/lib/biblioteca/queries";
import { canAccessFullSummary } from "@/lib/biblioteca/access";

/**
 * Download do RESUMO COMPLETO (Premium). Gera um .doc simples (HTML que o Word
 * abre). A geração de .docx formatado fica para uma fase futura.
 */
export async function GET(
  _req: Request,
  { params }: { params: { subject: string; content: string } }
) {
  const profile = await getProfile();
  if (!canAccessFullSummary(profile)) {
    return new Response("Recurso exclusivo do plano Premium.", { status: 403 });
  }

  const view = await getContentView(params.subject, params.content);
  if (!view) return new Response("Conteúdo não encontrado.", { status: 404 });

  const body = await getPremiumBody(view.content.id);
  if (!body) return new Response("Resumo completo indisponível.", { status: 404 });

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapeHtml(view.content.title)}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;line-height:1.5;max-width:800px;margin:0 auto;padding:24px">
<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(body)}</pre>
</body></html>`;

  const filename = `cogni-ia-${params.subject}-${params.content}.doc`;

  return new Response(html, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
