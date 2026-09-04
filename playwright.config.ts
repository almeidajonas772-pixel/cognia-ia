import { defineConfig, devices } from "@playwright/test";

/**
 * Fase 12 — Testes de ponta a ponta (Playwright).
 *
 * Cobrem o "caminho feliz" público (marketing, políticas, navegação). Fluxos
 * autenticados exigem um Supabase de teste — quando `E2E_BASE_URL` aponta para
 * um ambiente já provisionado, rode a suíte completa lá.
 *
 * Local:  npm run test:e2e:install  (uma vez)  &&  npm run test:e2e
 */
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
          NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
        },
      },
});
