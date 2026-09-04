# Checklist de produção — COGNI IA

Passo a passo para colocar no ar. Marque cada item.

## 1. Provisionamento

- [ ] Projeto **Supabase** criado (região `sa-east-1` / São Paulo).
- [ ] Projeto **Vercel** conectado ao repositório.
- [ ] Domínio apontado (`cogniai.com.br`) + `NEXT_PUBLIC_APP_URL` correspondente.
- [ ] (Opcional) **Upstash Redis** (cache/rate-limit entre instâncias).
- [ ] Conta **Mercado Pago** (produção) para assinaturas.

## 2. Migrações do banco (SQL Editor, nesta ordem)

- [ ] `0001_init.sql`
- [ ] `0002_biblioteca.sql`
- [ ] `0003_chat.sql`
- [ ] `0004_progresso.sql`
- [ ] `0005_redacao.sql`
- [ ] `0006_comunidade.sql`
- [ ] `0007_billing.sql`
- [ ] `0008_admin_blog.sql`
- [ ] `0009_infra.sql`
- [ ] `0010_seguranca.sql`
- [ ] `0011_onboarding.sql`
- [ ] `0012_crescimento.sql`
- [ ] `0013_ia_adaptativa.sql`
- [ ] `npm run seed:biblioteca` (conteúdo inicial da biblioteca)
- [ ] Inserir o(s) primeiro(s) admin(s) em `app_admins`.

## 3. Buckets de Storage

- [ ] `avatars` (público)
- [ ] `blog` (público)
- [ ] `essays` (privado)
- [ ] `materials` (privado)
- [ ] `exports` (privado)

## 4. Variáveis de ambiente na Vercel

Obrigatórias:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Fortemente recomendadas em produção:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` (webhooks, cron, filas, telemetria, LGPD)
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `CRON_SECRET` (`openssl rand -hex 32`)
- [ ] `APP_ENCRYPTION_KEY` (`openssl rand -hex 32`)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`

Opcionais:

- [ ] `OPENAI_API_KEY` (+ `OPENAI_CHAT_MODEL`)
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_GA_ID`
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] `IP_HASH_SECRET`

> O boot loga o que está faltando (`lib/env.ts` / `instrumentation.ts`).

## 5. Integrações

- [ ] Webhook do Mercado Pago →
      `{APP_URL}/api/billing/webhook?secret={MERCADOPAGO_WEBHOOK_SECRET}`
- [ ] Cron a cada 5 min → `GET {APP_URL}/api/cron` com
      `Authorization: Bearer {CRON_SECRET}` (o `vercel.json` já declara).
- [ ] Supabase Auth: provedores (e-mail/senha, Google), URLs de redirect
      (`{APP_URL}/auth/callback`), template de e-mail.
- [ ] (Opcional) Supabase Auth → MFA habilitado.

## 6. Antes do deploy

- [ ] `npm run check` (typecheck + lint + unit) verde.
- [ ] `npm run build` local verde.
- [ ] `npm run test:e2e` contra staging verde.

## 7. Depois do deploy (smoke em produção)

- [ ] Landing, `/precos`, `/blog`, `/privacidade`, `/termos` abrem.
- [ ] Cadastro + login + logout funcionam.
- [ ] `/dashboard` carrega; biblioteca lista conteúdo.
- [ ] Chat responde (mock ou real conforme a chave).
- [ ] Enviar redação → correção conclui (fila).
- [ ] Checkout (simulado ou real) ativa o Premium; webhook registra em
      `billing_events`.
- [ ] `/admin/saude` — banco, cache, fila e IA em verde/aceitável.
- [ ] `/admin/consumo` acumula chamadas de IA.
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" {APP_URL}/api/cron` → `ok`.
- [ ] Exportar dados (`/perfil/privacidade`) gera o JSON para download.
- [ ] Cabeçalhos de segurança presentes (`curl -I {APP_URL}` → HSTS, CSP-RO,
      X-Content-Type-Options).

## 8. Observabilidade contínua

- [ ] Serviço de uptime apontando para `{APP_URL}/api/cron` (ou `/`).
- [ ] Alerta se `/admin/saude` reportar `erro` (banco/fila).
- [ ] Revisar `/admin/logs`, `/admin/seguranca` e `/admin/consumo` semanalmente.

## 9. Rollback

- [ ] Vercel: "Promote to Production" numa build anterior (deploy imutável).
- [ ] Banco: migrações são aditivas; para reverter uma tabela nova, `drop table`
      manual — **não** há downgrade automático. Fazer backup antes de cada
      migração nova.
- [ ] Feature kill-switches via `site_config` / `billing_config` (admin) sem
      novo deploy.
