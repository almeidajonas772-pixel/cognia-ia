import { describe, it, expect } from "vitest";
import { BANCAS, BANCA_IDS, getBanca } from "@/lib/redacao/bancas";
import { DEFAULT_FREE_LIMITS, PRICES } from "@/lib/billing/config";
import { cn } from "@/lib/utils";

describe("redacao.bancas (dados de referência)", () => {
  it("inclui o ENEM e o lookup por id funciona", () => {
    expect(BANCA_IDS).toContain("enem");
    expect(getBanca("enem")?.id).toBe("enem");
    expect(getBanca("enem")?.scaleMax).toBe(1000);
  });

  it("toda banca tem escala positiva e ao menos uma competência", () => {
    for (const b of BANCAS) {
      expect(b.scaleMax).toBeGreaterThan(0);
      expect(b.competencies.length).toBeGreaterThan(0);
      for (const c of b.competencies) {
        expect(c.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("ids de banca são únicos", () => {
    expect(new Set(BANCA_IDS).size).toBe(BANCA_IDS.length);
  });

  it("banca inexistente retorna undefined", () => {
    expect(getBanca("banca-que-nao-existe")).toBeUndefined();
  });
});

describe("billing.config (preços e limites)", () => {
  it("preços oficiais da spec", () => {
    expect(PRICES.mensal.price).toBe(14.9);
    expect(PRICES.anual.price).toBe(119.9);
  });

  it("todos os limites do plano gratuito são inteiros >= 0", () => {
    for (const [, v] of Object.entries(DEFAULT_FREE_LIMITS)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("utils.cn", () => {
  it("combina classes e resolve conflitos do Tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
    expect(cn("a", ["b", "c"])).toBe("a b c");
  });
});
