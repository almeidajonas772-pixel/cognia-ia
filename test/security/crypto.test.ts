import { describe, it, expect } from "vitest";
import {
  encryptField,
  decryptField,
  hashIp,
  safeEqual,
  randomToken,
  clientIp,
  isEncryptionConfigured,
} from "@/lib/security/crypto";

describe("crypto.encryptField / decryptField", () => {
  it("faz round-trip de um valor UTF-8", () => {
    const plain = "Redação nota 1000 — ção, ê, ç 🎓";
    const env = encryptField(plain);
    expect(env.startsWith("v1:")).toBe(true);
    expect(env).not.toContain(plain);
    expect(decryptField(env)).toBe(plain);
  });

  it("usa IV aleatório: dois envelopes do mesmo texto diferem", () => {
    const a = encryptField("igual");
    const b = encryptField("igual");
    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe("igual");
    expect(decryptField(b)).toBe("igual");
  });

  it("rejeita envelope adulterado (GCM auth tag)", () => {
    const env = encryptField("secreto");
    const parts = env.split(":");
    parts[3] = Buffer.from("outro conteudo qualquer").toString("base64");
    expect(() => decryptField(parts.join(":"))).toThrow();
  });

  it("rejeita formato de envelope inválido", () => {
    expect(() => decryptField("nao-e-envelope")).toThrow();
    expect(() => decryptField("v2:a:b:c")).toThrow();
  });
});

describe("crypto.hashIp", () => {
  it("é determinístico e não reversível (hex de 32 chars)", () => {
    const h1 = hashIp("203.0.113.7");
    const h2 = hashIp("203.0.113.7");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{32}$/);
    expect(h1).not.toContain("203.0.113.7");
  });

  it("IPs diferentes geram hashes diferentes", () => {
    expect(hashIp("1.1.1.1")).not.toBe(hashIp("1.1.1.2"));
  });

  it("retorna null para IP ausente", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
    expect(hashIp("")).toBeNull();
  });
});

describe("crypto.safeEqual", () => {
  it("compara em tempo constante", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("crypto.randomToken", () => {
  it("gera tokens únicos base64url", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("crypto.clientIp", () => {
  it("prioriza o primeiro IP de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" });
    expect(clientIp(h)).toBe("198.51.100.9");
  });
  it("cai para x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "192.0.2.44" });
    expect(clientIp(h)).toBe("192.0.2.44");
  });
  it("retorna null sem cabeçalhos", () => {
    expect(clientIp(new Headers())).toBeNull();
  });
});

describe("crypto.isEncryptionConfigured", () => {
  it("verdadeiro quando APP_ENCRYPTION_KEY existe (setup de teste)", () => {
    expect(isEncryptionConfigured()).toBe(true);
  });
});
