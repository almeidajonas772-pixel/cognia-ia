import { test, expect } from "@playwright/test";

/**
 * Smoke público — não depende de sessão nem de dados. Garante que o app sobe,
 * as rotas de marketing/legais renderizam e a navegação básica funciona.
 */

test("landing page carrega e tem CTA de cadastro", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/COGNI IA/i);
  await expect(page.getByRole("link", { name: /criar conta/i }).first()).toBeVisible();
});

test("página de planos mostra os preços da spec", async ({ page }) => {
  await page.goto("/precos");
  await expect(page.getByText(/14,90/).first()).toBeVisible();
  await expect(page.getByText(/119,90/).first()).toBeVisible();
});

test("política de privacidade e termos renderizam", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: /política de privacidade/i })).toBeVisible();

  await page.goto("/termos");
  await expect(page.getByRole("heading", { name: /termos de uso/i })).toBeVisible();
});

test("rota protegida redireciona para /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("banner de consentimento de cookies aparece e pode ser dispensado", async ({ page }) => {
  await page.goto("/");
  const soEssenciais = page.getByRole("button", { name: /só essenciais/i });
  await expect(soEssenciais).toBeVisible();
  await soEssenciais.click();
  await expect(soEssenciais).toBeHidden();
});
