import { describe, it, expect } from "vitest";
import { mockProvider, mockVision } from "@/lib/ai/providers/mock";

describe("ai.mockProvider", () => {
  it("não é 'live' e tem id 'mock'", () => {
    expect(mockProvider.live).toBe(false);
    expect(mockProvider.id).toBe("mock");
  });

  it("generateText devolve texto com o aviso de modo demonstração", async () => {
    const out = await mockProvider.generateText({
      system: "Você é um professor.",
      messages: [{ role: "user", content: "O que é fotossíntese?" }],
    });
    expect(out).toContain("Modo demonstração");
    expect(out.toLowerCase()).toContain("fotossíntese");
  });

  it("responde JSON válido quando o sistema pede questões", async () => {
    const out = await mockProvider.generateText({
      system: 'Responda APENAS com JSON no formato {"questions": [...]}',
      messages: [{ role: "user", content: "Gere 2 questões de biologia" }],
    });
    const parsed = JSON.parse(out) as { questions: unknown[] };
    expect(Array.isArray(parsed.questions)).toBe(true);
    expect(parsed.questions.length).toBe(2);
  });

  it("streamChat emite pedaços que concatenam na resposta completa", async () => {
    const input = {
      system: "Você é um professor.",
      messages: [{ role: "user" as const, content: "Explique a Lei de Ohm." }],
    };
    let streamed = "";
    for await (const chunk of mockProvider.streamChat(input)) streamed += chunk;
    expect(streamed.length).toBeGreaterThan(0);
    expect(streamed).toContain("Modo demonstração");
  });
});

describe("ai.mockVision", () => {
  it("devolve uma análise textual de demonstração", async () => {
    const out = await mockVision.analyzeImage({
      prompt: "descreva a imagem",
      images: [{ dataUrl: "data:image/png;base64,AAAA" }],
    });
    expect(out).toMatch(/demonstra/i);
  });
});
