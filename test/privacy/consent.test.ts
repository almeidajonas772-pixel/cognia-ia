import { describe, it, expect, vi } from "vitest";

// consent.ts importa `next/headers`; nos testes de unidade ele nunca é chamado.
vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
}));

import { parseConsentCookie, CONSENT_COOKIE } from "@/lib/privacy/consent";

describe("privacy.parseConsentCookie", () => {
  it("default sem cookie: só essenciais", () => {
    const c = parseConsentCookie(undefined);
    expect(c).toMatchObject({ essential: true, analytics: false, marketing: false });
    expect(c.decidedAt).toBeNull();
  });

  it("lê analytics/marketing do JSON", () => {
    const raw = JSON.stringify({ analytics: true, marketing: false, decidedAt: "2026-08-30T00:00:00Z" });
    const c = parseConsentCookie(raw);
    expect(c.analytics).toBe(true);
    expect(c.marketing).toBe(false);
    expect(c.essential).toBe(true);
    expect(c.decidedAt).toBe("2026-08-30T00:00:00Z");
  });

  it("coage valores ausentes/estranhos para boolean", () => {
    const c = parseConsentCookie(JSON.stringify({ analytics: "sim" }));
    expect(c.analytics).toBe(true);
    expect(c.marketing).toBe(false);
    expect(typeof c.decidedAt).toBe("string");
  });

  it("JSON inválido cai no default seguro", () => {
    const c = parseConsentCookie("{quebrado");
    expect(c).toMatchObject({ essential: true, analytics: false, marketing: false });
  });

  it("expõe o nome do cookie", () => {
    expect(CONSENT_COOKIE).toBe("cogni_consent");
  });
});
