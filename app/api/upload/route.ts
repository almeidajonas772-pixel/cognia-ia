import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/admin/guard";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { uploadFile } from "@/lib/storage";
import { UPLOAD_RULES, type UploadKind } from "@/lib/storage/validate";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_ONLY: UploadKind[] = ["blog_cover"];

/**
 * Fase 10 — Endpoint único de upload (spec §3).
 * multipart/form-data: campos `kind` e `file`. Valida no servidor (mime real,
 * tamanho, magic bytes) e devolve o caminho/URL do arquivo.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "upload", RATE_RULES.upload, user.id);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const kind = String(form.get("kind") ?? "") as UploadKind;
  if (!UPLOAD_RULES[kind])
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });

  if (ADMIN_ONLY.includes(kind) && !(await isAppAdmin(user.id)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const file = form.get("file");
  if (!(file instanceof Blob))
    return NextResponse.json({ error: "no_file" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileName = file instanceof File ? file.name : "upload";

  const res = await uploadFile({
    kind,
    ownerId: user.id,
    fileName,
    contentType: file.type || "application/octet-stream",
    bytes,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 });
  return NextResponse.json({
    ok: true,
    path: res.path,
    bucket: res.bucket,
    url: res.url,
    mime: res.mime,
    size: res.size,
  });
}
