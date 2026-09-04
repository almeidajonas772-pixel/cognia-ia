import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getChatProvider, getVisionProvider } from "@/lib/ai";
import { canUseRedacao } from "@/lib/redacao/access";
import { buildOcrPrompt, buildRubricPrompt } from "@/lib/redacao/prompts";
import type { ImageAttachment } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  name?: string;
  raw?: string;
  images?: ImageAttachment[];
  source?: string;
};

function extractJson(s: string): Record<string, unknown> | null {
  let t = s.trim();
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) t = f[1].trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try {
    return JSON.parse(t.slice(a, b + 1));
  } catch {
    return null;
  }
}

/** Interpreta uma rubrica personalizada (spec §2.2) e salva. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canUseRedacao(await getProfile()))
    return NextResponse.json({ error: "premium_required" }, { status: 402 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let raw = (body.raw ?? "").trim();
  try {
    if (!raw && body.images?.length) {
      raw = (
        await getVisionProvider().analyzeImage({
          prompt: buildOcrPrompt(),
          images: body.images.slice(0, 6),
        })
      ).trim();
    }
  } catch {
    return NextResponse.json({ error: "ocr_failed" }, { status: 502 });
  }
  if (raw.length < 20)
    return NextResponse.json({ error: "rubrica_curta" }, { status: 400 });

  const provider = getChatProvider();
  let parsed: Record<string, unknown> | null = null;
  if (provider.live) {
    try {
      const { system, user: u } = buildRubricPrompt(raw);
      const out = await provider.generateText({
        system,
        messages: [{ role: "user", content: u }],
        temperature: 0.1,
      });
      parsed = extractJson(out);
    } catch (err) {
      console.error("rubrica parse:", err);
    }
  }
  if (!parsed || !Array.isArray(parsed.criteria)) {
    // fallback: uma rubrica genérica com o texto bruto como observação
    parsed = {
      scaleMax: 10,
      criteria: [
        { name: "Conteúdo e argumentação", weight: 1, max: 4 },
        { name: "Estrutura e coesão", weight: 1, max: 3 },
        { name: "Norma culta", weight: 1, max: 3 },
      ],
      notes: raw.slice(0, 500),
      ambiguities: provider.live
        ? []
        : ["Modo demonstração: rubrica não interpretada automaticamente."],
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("essay_rubrics")
    .insert({
      user_id: user.id,
      name: (body.name ?? "Rubrica personalizada").trim().slice(0, 120),
      source: body.source ?? (body.images?.length ? "imagem" : "texto"),
      raw,
      parsed,
    })
    .select("id")
    .single();

  if (error || !data)
    return NextResponse.json({ error: "save_failed" }, { status: 500 });

  return NextResponse.json({ rubricId: data.id, parsed });
}
