import type { VisionProvider, ImageAttachment } from "@/lib/ai/types";

const MODEL = process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash";
const BASE =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

export const geminiVision: VisionProvider = {
  id: MODEL,
  live: true,

  async analyzeImage({
    prompt,
    images,
  }: {
    prompt: string;
    images: ImageAttachment[];
  }) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY ausente");

    const parts: unknown[] = [{ text: prompt }];
    for (const img of images) {
      const parsed = parseDataUrl(img.dataUrl);
      if (parsed) {
        parts.push({
          inline_data: { mime_type: parsed.mimeType, data: parsed.data },
        });
      }
    }

    const res = await fetch(
      `${BASE}/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }] }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    return text || "Não foi possível interpretar a imagem.";
  },
};
