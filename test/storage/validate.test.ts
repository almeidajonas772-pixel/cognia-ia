import { describe, it, expect } from "vitest";
import {
  sniffMime,
  extFromMime,
  validateUpload,
  UPLOAD_RULES,
} from "@/lib/storage/validate";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x10, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0,
]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

describe("storage.sniffMime", () => {
  it("reconhece PNG / JPEG / PDF / WEBP pelos magic bytes", () => {
    expect(sniffMime(PNG)).toBe("image/png");
    expect(sniffMime(JPEG)).toBe("image/jpeg");
    expect(sniffMime(PDF)).toBe("application/pdf");
    expect(sniffMime(WEBP)).toBe("image/webp");
  });
  it("retorna null para formato desconhecido (GIF não suportado)", () => {
    expect(sniffMime(GIF)).toBeNull();
    expect(sniffMime(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("storage.extFromMime", () => {
  it("mapeia mime -> extensão", () => {
    expect(extFromMime("image/png")).toBe("png");
    expect(extFromMime("image/jpeg")).toBe("jpg");
    expect(extFromMime("application/pdf")).toBe("pdf");
    expect(extFromMime("application/x-qualquer")).toBe("bin");
  });
});

describe("storage.validateUpload", () => {
  it("aceita PNG dentro do limite para avatar", () => {
    const r = validateUpload("avatar", "image/png", PNG);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mime).toBe("image/png");
  });

  it("rejeita PDF em avatar (mime não permitido para o tipo)", () => {
    const r = validateUpload("avatar", "application/pdf", PDF);
    expect(r.ok).toBe(false);
  });

  it("aceita PDF em essay", () => {
    expect(validateUpload("essay", "application/pdf", PDF).ok).toBe(true);
  });

  it("rejeita quando o Content-Type declarado diverge do conteúdo real", () => {
    const r = validateUpload("essay", "image/png", JPEG);
    expect(r.ok).toBe(false);
  });

  it("rejeita arquivo vazio", () => {
    expect(validateUpload("avatar", "image/png", new Uint8Array()).ok).toBe(false);
  });

  it("rejeita acima do limite de tamanho", () => {
    const big = new Uint8Array(UPLOAD_RULES.avatar.maxBytes + 1);
    big.set(PNG);
    const r = validateUpload("avatar", "image/png", big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/limite/i);
  });

  it("rejeita conteúdo sem assinatura reconhecível", () => {
    const r = validateUpload("essay", "application/pdf", new Uint8Array([9, 9, 9, 9, 9]));
    expect(r.ok).toBe(false);
  });
});
