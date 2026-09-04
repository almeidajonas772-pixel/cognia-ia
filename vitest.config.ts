import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Fase 12 — Testes unitários (Vitest).
 *
 * Ambiente `node`: a suíte cobre a lógica pura e testável sem browser nem
 * banco (crypto, rate limit, cache, validação de upload, moderação, parsing).
 * O fluxo de UM ↔ UI fica no Playwright (`e2e/`).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // módulos com efeito colateral de ambiente ficam de fora do unit
    exclude: ["node_modules", ".next", "e2e"],
    clearMocks: true,
    setupFiles: ["test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/*.d.ts",
        "lib/supabase/**",
        "lib/**/actions.ts",
        "lib/**/queries.ts",
      ],
    },
  },
});
