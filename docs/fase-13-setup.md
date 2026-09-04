# Fase 13 — Deploy, Onboarding e SEO de lançamento

Fase de lançamento: mecânica de deploy, primeira experiência do usuário e os
últimos ajustes de SEO. Aditiva — nada das fases 2–12 muda de comportamento.

---

## 1. Migração

No **SQL Editor** do Supabase, depois de `0001`–`0011` (ordem completa em
`docs/producao-checklist.md`):

```
supabase/migrations/0011_onboarding.sql
```

Cria:

| Objeto | Papel |
| --- | --- |
| `user_onboarding` | objetivo, data da prova, matérias-alvo, nível, passos concluídos |
| `complete_onboarding()` | marca o onboarding como concluído (RPC, `auth.uid()`) |
| `waitlist` | lista de espera (modo de lançamento `waitlist`) |
| `site_config.launch` | seed: `{"mode":"live","banner":null,"signup_open":true}` |

RLS: `user_onboarding` é do próprio usuário (+ admin lê); `waitlist` só admin lê,
escrita via service role (`/api/waitlist`). `types.ts` já foi estendido.

---

## 2. Onboarding

- **`/bem-vindo`** — wizard de 4 passos (objetivo → data → matérias → nível).
  `saveOnboarding` grava e semeia `chat_user_memory.level` (Fase 4) para
  personalizar a IA desde a primeira conversa. `completeOnboarding` conclui.
- **Cartão no dashboard** (`<OnboardingCard/>`) — aparece até concluir/dispensar,
  com CTA para o wizard e a checklist de primeiros passos.
- **Fluxo de entrada**: novos cadastros vão para `/bem-vindo`
  (`AuthForm` + `emailRedirectTo`); a página redireciona a quem já concluiu.
- Fail-open: sem `SUPABASE_SERVICE_ROLE_KEY` (modo demo) o cartão some sem erro.

---

## 3. Modo de lançamento (`site_config.launch`)

Editável direto na tabela `site_config` (chave `launch`), sem novo deploy:

```json
{ "mode": "live", "banner": "texto do aviso ou null", "signup_open": true }
```

| `mode` | Efeito |
| --- | --- |
| `live` | normal |
| `waitlist` | `/cadastro` mostra `<WaitlistForm/>`; faixa de aviso no topo |
| `maintenance` | **middleware** reescreve tudo para `/manutencao`, exceto `/api`, `/admin`, `/login`, `/auth`, assets e o próprio `/manutencao` (admin consegue reverter) |

`banner` (string) mostra uma faixa fina no topo do site e do app.
`signup_open: false` também força a lista de espera.
Checagem com cache de 60s (`lib/launch.ts`), fail-open para `live`.

---

## 4. SEO de lançamento

| Arquivo | Entrega |
| --- | --- |
| `app/manifest.ts` | Web App Manifest (instalável, tema `#0B1220`) |
| `app/icon.tsx` / `app/apple-icon.tsx` | ícones gerados (`next/og`) |
| `app/opengraph-image.tsx` | imagem OG/Twitter padrão 1200×630 |
| `app/layout.tsx` | `manifest`, `appleWebApp`, `robots`, `alternates.canonical`, `viewport.themeColor`, `verification.google` (via `GOOGLE_SITE_VERIFICATION`) |
| `components/seo/JsonLd.tsx` | JSON-LD `Organization` + `WebSite` (layout de marketing) e `FAQPage` (`/precos`) |
| `public/humans.txt` | crédito/stack |
| `vercel.json` | `regions: ["gru1"]` (São Paulo) |

Já existiam da Fase 9: `sitemap.ts`, `robots.ts`, metadata/OG por página, ISR,
JSON-LD `BlogPosting`.

**Google Search Console**: defina `GOOGLE_SITE_VERIFICATION` (ou verifique por
DNS), depois envie `https://SEU-DOMINIO/sitemap.xml`.

---

## 5. Deploy na Vercel — passo a passo

1. **Importar o repositório** na Vercel (framework detectado: Next.js).
2. **Root Directory**: raiz do repo. Build: `next build` (padrão). Node 20.
3. **Environment Variables** — copie de `docs/producao-checklist.md`
   (obrigatórias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
   recomendadas: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`,
   `CRON_SECRET`, `APP_ENCRYPTION_KEY`, `MERCADOPAGO_*`).
4. **Domínio**: adicione `cogniai.com.br` (+ `www` → redirect). Ajuste
   `NEXT_PUBLIC_APP_URL` para `https://cogniai.com.br`.
5. **Cron**: `vercel.json` já declara `/api/cron` a cada 5 min — a Vercel injeta
   `Authorization: Bearer $CRON_SECRET` automaticamente se a env existir.
6. **Região**: `gru1` (no `vercel.json`). Crie o projeto **Supabase** em
   `sa-east-1` (São Paulo) para casar a latência.
7. **Supabase Auth** → Redirect URLs: `https://cogniai.com.br/auth/callback`.
8. Rode as migrações `0001`→`0011` no SQL Editor, crie os 5 buckets, insira o
   admin em `app_admins`, `npm run seed:biblioteca`.
9. **Webhook Mercado Pago** →
   `https://cogniai.com.br/api/billing/webhook?secret=$MERCADOPAGO_WEBHOOK_SECRET`.

Pós-deploy: siga o smoke de `docs/producao-checklist.md` §7.

---

## 6. Checklist da fase

- [ ] `0011_onboarding.sql` rodou sem erro.
- [ ] `/bem-vindo` abre, salva e redireciona ao concluir.
- [ ] Cartão de onboarding aparece no dashboard para conta nova e some ao dispensar.
- [ ] `site_config.launch.mode = "maintenance"` → todo o site cai em `/manutencao`,
      mas `/admin` e `/login` seguem acessíveis; voltar para `"live"` restaura.
- [ ] `site_config.launch.mode = "waitlist"` → `/cadastro` mostra a lista de espera;
      enviar e-mail grava em `waitlist`.
- [ ] `/manifest.webmanifest`, `/icon`, `/opengraph-image` respondem 200.
- [ ] `view-source` da home tem o JSON-LD `Organization`/`WebSite`; `/precos` tem `FAQPage`.
- [ ] `npm run build` + `npm run check` verdes.
