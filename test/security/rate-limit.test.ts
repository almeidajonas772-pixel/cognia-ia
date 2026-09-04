import { describe, it, expect, vi, afterEach } from "vitest";

// rate-limit.ts importa `next/server` (para o helper enforceRate, não testado aqui).
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: unknown) => ({ body, init }),
  },
}));

import { checkRate, RATE_RULES } from "@/lib/security/rate-limit";

const RULE = { limit: 3, windowSeconds: 60 };

describe("rate-limit.checkRate (janela fixa, back-end de memória)", () => {
  afterEach(() => vi.useRealTimers());

  it("libera até o limite e bloqueia depois", async () => {
    const id = `id-${Math.random()}`;
    const r1 = await checkRate("t", id, RULE);
    const r2 = await checkRate("t", id, RULE);
    const r3 = await checkRate("t", id, RULE);
    const r4 = await checkRate("t", id, RULE);

    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.ok).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.ok).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("identificadores diferentes têm contadores independentes", async () => {
    const a = await checkRate("t", `a-${Math.random()}`, RULE);
    const b = await checkRate("t", `b-${Math.random()}`, RULE);
    expect(a.ok && b.ok).toBe(true);
    expect(a.remaining).toBe(2);
    expect(b.remaining).toBe(2);
  });

  it("reinicia numa nova janela", async () => {
    vi.useFakeTimers();
    const id = `w-${Math.random()}`;
    await checkRate("t", id, RULE);
    await checkRate("t", id, RULE);
    await checkRate("t", id, RULE);
    expect((await checkRate("t", id, RULE)).ok).toBe(false);

    vi.advanceTimersByTime(61_000);
    const after = await checkRate("t", id, RULE);
    expect(after.ok).toBe(true);
    expect(after.remaining).toBe(2);
  });

  it("os perfis prontos têm limites e janelas positivos", () => {
    for (const rule of Object.values(RATE_RULES)) {
      expect(rule.limit).toBeGreaterThan(0);
      expect(rule.windowSeconds).toBeGreaterThan(0);
    }
  });
});
