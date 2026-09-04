import { describe, it, expect, vi } from "vitest";

// sessions.ts -> @/lib/supabase/server -> next/headers (só usado em runtime de request).
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: () => {}, get: () => undefined }),
}));

import { jwtIat } from "@/lib/security/sessions";

function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.assinatura-fake`;
}

describe("sessions.jwtIat", () => {
  it("extrai o claim iat de um JWT", () => {
    expect(jwtIat(fakeJwt({ iat: 1_726_000_000, sub: "u1" }))).toBe(1_726_000_000);
  });

  it("suporta base64url (com - e _)", () => {
    // payload escolhido para produzir '-' / '_' no base64url
    const token = fakeJwt({ iat: 1_726_000_123, data: "??>>字" });
    expect(jwtIat(token)).toBe(1_726_000_123);
  });

  it("retorna null para token ausente ou malformado", () => {
    expect(jwtIat(null)).toBeNull();
    expect(jwtIat(undefined)).toBeNull();
    expect(jwtIat("sem-pontos")).toBeNull();
    expect(jwtIat("a.nao-e-base64-valido!.c")).toBeNull();
  });

  it("retorna null quando não há iat no payload", () => {
    expect(jwtIat(fakeJwt({ sub: "u1" }))).toBeNull();
  });
});
