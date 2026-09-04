# COGNI IA

Plataforma de estudos com IA para ENEM e vestibulares.

> **Estado atual: Fase 15 (final) — IA adaptativa, memória evolutiva e roteamento de modelo.**
> Roteador que estima a complexidade do pedido e escolhe o modelo (barato no
> comum, forte em redação/questões difíceis/provas), memória do aluno que
> **evolui** periodicamente (job da fila + cron) destilando chat + erros de
> redação + progresso num perfil (`evolved_summary`/`strengths`/`weaknesses`)
> injetado no system prompt, "Plano de hoje" adaptativo no dashboard, e painel
> `/admin/ia`.
>
> Setup em ordem: [`docs/fase-2-setup.md`](docs/fase-2-setup.md) →
> [`3`](docs/fase-3-setup.md) → [`4`](docs/fase-4-setup.md) →
> [`5`](docs/fase-5-setup.md) → [`6`](docs/fase-6-setup.md) →
> [`7`](docs/fase-7-setup.md) → [`8`](docs/fase-8-setup.md) →
> [`9`](docs/fase-9-setup.md) → [`10`](docs/fase-10-setup.md) →
> [`11`](docs/fase-11-setup.md) → [`12`](docs/fase-12-setup.md) →
> [`13`](docs/fase-13-setup.md) → [`14`](docs/fase-14-setup.md) →
> [`15`](docs/fase-15-setup.md).
> Deploy: [`docs/producao-checklist.md`](docs/producao-checklist.md).

---

## Stack

| Camada       | Tecnologia                                  | Entra na fase |
| ------------ | ------------------------------------------- | ------------- |
| Framework    | Next.js 14 (App Router) + TypeScript        | 1             |
| Estilo       | Tailwind CSS + typography (prose)           | 1 / 3         |
| Ícones       | lucide-react                                | 1             |
| Markdown     | react-markdown + remark-gfm                 | 3             |
| Auth + DB    | Supabase (Postgres, Auth, Storage, RLS)     | 2             |
| IA           | OpenAI (chat/resumos/questões) + Gemini (imagem); mock sem chave | 4 |
| Pagamentos   | Mercado Pago (assinaturas, Pix, boleto)     | 8             |
| Cache/filas  | Cache KV (memória / Upstash Redis) + fila no Postgres | 10   |
| Observabilidade | system_logs + ai_calls (custo) + /admin/saude   | 10            |
| Segurança    | rate limit (KV) + 2FA/TOTP + auditoria + AES-GCM + LGPD | 11    |
| Testes       | Vitest (unit) + Playwright (E2E) + CI (GitHub Actions) | 12    |
| Deploy       | Vercel (região gru1) + Supabase sa-east-1   | 13            |
| Lançamento   | onboarding + site_config.launch (waitlist/maintenance) | 13   |
| Crescimento  | XP/níveis/conquistas + indicação + recap/nudges (cron) | 14   |
| IA adaptativa | roteamento de modelo + memória evolutiva (fila/cron) + plano de hoje | 15 |

## Como rodar

Pré-requisitos:

- **Node.js 18.18+** (https://nodejs.org)
- Um projeto **Supabase** gratuito + arquivo `.env.local` — ver
  [`docs/fase-2-setup.md`](docs/fase-2-setup.md)

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem `.env.local` a landing page carrega, mas
login e rotas do app não funcionam.

### Qualidade

```bash
npm run check         # typecheck + lint + testes unitários (Vitest)
npm run test:watch    # TDD
npm run test:e2e      # smoke Playwright (baixe o Chromium: npm run test:e2e:install)
```

CI (`.github/workflows/ci.yml`): `quality` (typecheck/lint/test) + `build` +
`e2e` smoke. Antes de deploy, ver [`docs/producao-checklist.md`](docs/producao-checklist.md).

## Estrutura

```
app/
  (marketing)/          # Landing + /precos + /blog (SEO, ISR, público)
  (auth)/               # login, cadastro, esqueci-senha, redefinir-senha
  sitemap.ts robots.ts  # SEO — gerados dinamicamente
  (app)/                # Área logada (protegida): sidebar fixa + topbar
    dashboard/          # Fase 5 — dashboard (+ cartões de onboarding/gamificação, Fases 13/14)
    bem-vindo/          # Fase 13 — wizard de onboarding
    conquistas/ convidar/  # Fase 14 — gamificação + indicação
    biblioteca/         # Fase 3 — hub, [subject], [subject]/[content], busca
    chat/               # Fase 4 — layout + hub + [id] (streaming)
    redacao/            # Fase 6 — lista, nova, [id], estatísticas (Premium)
    comunidade/         # Fase 7 — hub, g/[slug], p/[id], notificações, admin
    favoritos/          # Fase 5 — favoritos com busca e categorias
    historico/          # Fase 5 — linha do tempo com filtros
    perfil/             # dados (Fase 2) + assinatura (Fase 8) + seguranca/privacidade (Fase 11)
    admin/              # Fases 9–15 — dashboard, usuarios, biblioteca, blog, analytics, logs, config, monetizacao, saude, consumo, seguranca, ia
  (marketing)/privacidade, termos  # Fase 11 — políticas públicas (LGPD)
  manutencao/           # Fase 13 — tela de manutenção (rewrite pelo middleware)
  manifest.ts icon.tsx apple-icon.tsx opengraph-image.tsx  # Fase 13 — SEO/PWA gerados
  auth/callback/        # troca o code OAuth/e-mail pela sessão (+ registra sessão/auditoria)
  api/chat/             # Fase 4/11 — route (stream), summary, questions (rate limited)
  api/study/ping/       # Fase 5 — heartbeat de tempo de estudo
  api/redacao/          # Fase 6/10 — ocr, rubrica, [id]/corrigir (fila), [id]/status
  api/billing/          # Fase 8 — checkout, webhook
  api/analytics/track/  # Fase 9 — registro de visita de página
  api/upload/           # Fase 10 — upload único validado (MIME real + magic bytes)
  api/jobs/run/         # Fase 10 — worker da fila (Bearer CRON_SECRET ou admin)
  api/cron/             # Fase 10/11 — rotina periódica (expira, publica, drena, purga exclusões/exports)
  api/security/         # Fase 11 — session (registra dispositivo), logout (auditoria)
  api/privacy/          # Fase 11 — consent (cookie + DB), export/[id] (download assinado)
  api/waitlist/         # Fase 13 — captura de lista de espera
  api/observability/    # Fase 12 — client-error (beacon dos error boundaries)
middleware.ts           # renova sessão + protege rotas + gate de manutenção (Fase 13)
components/
  brand/                # Logo (símbolo + wordmark, herda cor do tema)
  ui/                   # Button, Card, Badge, PagePlaceholder, Skeleton
  layout/               # Sidebar, Topbar, MobileNav
  auth/                 # AuthForm, UserMenu, ProfileForm, AuthSkeleton
  security/             # Fase 11 — MfaSetup, SessionList, SessionSync, CancelDeletionButton
  privacy/              # Fase 11 — CookieConsent, ConsentedAnalytics, ConsentForm, DataExportPanel, DeleteAccountPanel
  onboarding/           # Fase 13 — OnboardingWizard, OnboardingCard, FirstStepLink, DismissOnboardingButton
  launch/               # Fase 13 — LaunchBanner, WaitlistForm
  seo/                  # Fase 13 — JsonLd (Organization/WebSite/FAQ)
  gamification/         # Fase 14 — GamificationCard, AchievementsGrid, AchievementToast, Leaderboard, WeeklyGoalControl
  referral/             # Fase 14 — ReferralPanel, CopyLinkButton, RefCapture
  biblioteca/           # SubjectCard, ContentRow, Markdown, ContentActions, ...
  chat/                 # ChatSidebar, ChatThread, Composer, GenerateDialog, ...
  progresso/            # Charts, Panels, ActivityTimeline, FavoritesList, ...
  redacao/              # RedacaoComposer, TranscriptionReview, CorrectionReport, ...
  comunidade/           # PostCard, PostComposer, CommentThread, AdminPanels, ...
  billing/              # PlanComparison, SubscribeButtons, UpgradeDialog, ...
  ads/                  # AdSlot, SponsorSlot
  admin/                # AdminSidebar, UserTable, ContentEditor, BlogEditor, ...
  blog/                 # BlogCard
  analytics/            # PageTracker, GoogleAnalytics
lib/
  nav.ts                # navegação e metadados do site
  auth.ts               # getUser / requireUser / getProfile (server)
  utils.ts              # helper cn()
  supabase/             # client.ts, server.ts, middleware.ts, types.ts
  biblioteca/           # queries.ts, actions.ts, access.ts, recurrence.ts, types.ts
  ai/                   # provedores (openai, gemini, mock) + prompts + routing/adaptive/memory-evolve (Fase 15)
  chat/                 # queries, actions, limits, memory, types, useChatStream
  progresso/            # queries, recommendations, activity, favorites, limits, actions
  redacao/              # bancas, prompts, correct, queries, actions, stats, access
  comunidade/           # queries, actions, admin, moderation, library-submit, access
  billing/              # entitlements, config, subscription, coupons, stats, provider, actions
  ads/                  # config, server (decideAd)
  admin/                # guard, stats, users, library, queries, actions, logs, config
  blog/                 # queries, actions
  analytics/            # queries
  cache/                # Fase 10 — KV (memória / Upstash Redis) + cached() + bust()
  queue/                # Fase 10 — enqueue / processJobs / registry + handlers
  storage/              # Fase 10 — uploadFile / signedUrl + validação (magic bytes)
  observability/        # Fase 10 — log (system_logs), ai-usage (ai_calls + custo), health
  ai/resilient.ts       # Fase 10 — retry + backoff + fallback p/ mock + telemetria
  security/             # Fase 11 — crypto (AES-GCM/hash IP), rate-limit, audit, sessions, mfa
  privacy/              # Fase 11 — consent, export (LGPD), deletion, collect, actions
  env.ts                # Fase 12 — inventário + checkEnv() das variáveis de ambiente
  launch.ts             # Fase 13 — estado de lançamento (site_config.launch), fetch cru p/ Edge
  onboarding/           # Fase 13 — types, queries (cache), actions
  gamification/         # Fase 14 — xp (curva), achievements (catálogo), queries, award, actions
  referral/             # Fase 14 — queries (código/link/histórico), apply (cookie → record_referral)
  supabase/service.ts   # clientes service-role e anônimo (webhooks / SSR estático)
instrumentation.ts      # Fase 12 — relatório de env no boot do servidor
test/                   # Fase 12 — suíte unitária Vitest (test/**/*.test.ts)
e2e/                    # Fase 12 — smoke Playwright (e2e/*.spec.ts)
vitest.config.ts playwright.config.ts
.github/workflows/ci.yml
app/error.tsx app/global-error.tsx app/(app)/error.tsx   # Fase 12 — error boundaries
content/biblioteca/     # manifest.mjs + *.md (fonte de autoria do catálogo)
public/img/biblioteca/  # diagramas SVG autorais dos resumos completos
scripts/seed-biblioteca.mjs   # npm run seed:biblioteca → upsert no Supabase
supabase/
  migrations/0001_init.sql        # Fase 2 — usuários, progresso, favoritos, ...
  migrations/0002_biblioteca.sql  # Fase 3 — library_* + RLS
  migrations/0003_chat.sql        # Fase 4 — chat_* + RLS + funções
  migrations/0004_progresso.sql   # Fase 5 — activity_log, study_*, content_difficulty
  migrations/0005_redacao.sql     # Fase 6 — essay_submissions, essay_rubrics, essay_error_bank
  migrations/0006_comunidade.sql  # Fase 7 — community_* + app_admins + RLS + seed de grupos
  migrations/0007_billing.sql     # Fase 8 — subscriptions, payments, coupons, billing_config, feature_usage
  migrations/0008_admin_blog.sql  # Fase 9 — blog_posts, admin_logs, site_config, user_moderation, page_views
  migrations/0009_infra.sql       # Fase 10 — jobs, system_logs, ai_calls, storage_objects + fila/telemetria/cron
  migrations/0010_seguranca.sql   # Fase 11 — user_security, user_sessions, user_consent, security_events, data_exports
  migrations/0011_onboarding.sql  # Fase 13 — user_onboarding, waitlist + site_config.launch
  migrations/0012_crescimento.sql # Fase 14 — user_gamification, xp_events, user_achievements, referral_codes, referrals
  migrations/0013_ia_adaptativa.sql # Fase 15 — chat_user_memory (+evolução), memory_snapshots, site_config.model_routing
vercel.json                       # Fase 10/13 — cron a cada 5 min + região gru1
```

## Identidade visual

| Token        | Hex       |
| ------------ | --------- |
| Fundo        | `#0B1220` |
| Cards        | `#111A2E` |
| Primária     | `#3B82F6` |
| Secundária   | `#60A5FA` |
| Texto        | `#E5E7EB` |
| Suporte      | `#94A3B8` |

Definidos em `tailwind.config.ts` e `app/globals.css`, **confirmados na base de
conhecimento oficial** (§7 Sistema de Cores). Estilo "Neo-Minimalismo
Educativo". Marca, voz e símbolo em [`docs/marca.md`](docs/marca.md) e
[`lib/brand.ts`](lib/brand.ts) (fonte única) — símbolo aplicado em cabeçalho,
auth, sidebar, favicon, ícone iOS e OG.

## Roadmap — 15 fases, todas implementadas

Cada fase é um módulo independente que consome as anteriores sem modificá-las.
Setup por fase em `docs/fase-N-setup.md`; migrações `0001`→`0013` em ordem
(`docs/producao-checklist.md`).

| # | Fase | Entrega principal |
| --- | --- | --- |
| 1 | Estrutura | Next.js 14 App Router, design system, navegação |
| 2 | Auth + Banco | Supabase, RLS, middleware, perfis |
| 3 | Biblioteca ENEM | catálogo curado, resumo rápido/completo, busca, SVGs autorais |
| 4 | Chat inteligente | tutor streaming, modos/profundidade, memória, geração de resumo/questões |
| 5 | Progresso | activity_log, streak, mastery por matéria, pontos fracos, analytics |
| 6 | Redação | OCR, correção por competência, banco de erros, bancas (ENEM/FUVEST/…) |
| 7 | Comunidade | grupos, posts, moderação (heurística + IA), denúncias, submissões |
| 8 | Monetização | Mercado Pago (assinatura/Pix/boleto), entitlements, cupons, anúncios |
| 9 | Admin + SEO + Blog | painel completo, sitemap/robots/OG/JSON-LD, page_views + GA |
| 10 | Infraestrutura | fila no Postgres, cache KV, logging, custo de IA, storage validado, `/api/cron` |
| 11 | Segurança + LGPD | rate limit, 2FA/TOTP, auditoria, AES-GCM, exportação/exclusão de dados, cookies |
| 12 | Testes + Produção | Vitest, Playwright, CI, error boundaries, `lib/env.ts`, checklist |
| 13 | Deploy + Onboarding | wizard `/bem-vindo`, `site_config.launch` (waitlist/manutenção), SEO de lançamento |
| 14 | Crescimento | XP/níveis/conquistas, ranking, recap/nudges (cron), indicação |
| 15 | IA adaptativa | roteamento de modelo, memória evolutiva (fila/cron), "plano de hoje" |
