import { describe, it, expect } from "vitest";
import { estimateCostUsd, approxTokens } from "@/lib/observability/ai-usage";

describe("ai-usage.approxTokens", () => {
  it("aproxima ~4 caracteres por token", () => {
    expect(approxTokens("")).toBe(0);
    expect(approxTokens("abcd")).toBe(1);
    expect(approxTokens("a".repeat(400))).toBe(100);
  });
  it("é tolerante a entradas não-string", () => {
    // @ts-expect-error teste de robustez
    expect(approxTokens(undefined)).toBe(0);
  });
});

describe("ai-usage.estimateCostUsd", () => {
  it("é zero para o provedor mock", () => {
    expect(estimateCostUsd("mock", 1000, 1000)).toBe(0);
  });

  it("usa a tabela de preços por modelo (gpt-4o-mini)", () => {
    // 1000 in * 0.00015 + 1000 out * 0.0006 = 0.00075
    expect(estimateCostUsd("gpt-4o-mini", 1000, 1000)).toBeCloseTo(0.00075, 6);
  });

  it("casa por substring do nome do modelo", () => {
    expect(estimateCostUsd("openai/gpt-4o-mini-2024", 1000, 0)).toBeCloseTo(0.00015, 6);
  });

  it("usa um preço genérico para modelo desconhecido", () => {
    const c = estimateCostUsd("modelo-novo-x", 1000, 1000);
    expect(c).toBeGreaterThan(0);
  });

  it("escala linearmente com os tokens", () => {
    const a = estimateCostUsd("gpt-4o", 1000, 1000);
    const b = estimateCostUsd("gpt-4o", 2000, 2000);
    expect(b).toBeCloseTo(a * 2, 8);
  });
});
