# Fase 9 — Painel Administrativo, SEO, Blog e Analytics

Módulo independente. Reaproveita `app_admins` / `is_app_admin()` (Fase 7).

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0008_admin_blog.sql`](../supabase/migrations/0008_admin_blog.sql)
(depois de 0001–0007).

Cria `blog_posts` (+ 3 artigos SEO de exemplo), `admin_logs`, `site_config`,
`user_moderation`, `page_views` e as funções `log_admin_action`,
`admin_set_plan`, `track_page_view`, `user_is_blocked`.

## 2. Google Analytics (opcional)

- `.env.local`: `NEXT_PUBLIC_GA_ID=G-XXXXXXXX` → o script gtag é injetado.
- O mesmo ID pode ser salvo em **/admin/config** (usado por integrações futuras).

## 3. Rodar

```bash
npm run dev
```

- `/admin` — painel (exige estar em `app_admins`, ver Fase 7)
- `/blog` e `/blog/[slug]` — blog público (ISR, SEO completo)
- `/sitemap.xml` e `/robots.txt` — gerados automaticamente

---

## O que foi implementado (spec Fase 9)

| Item | Onde |
| --- | --- |
| Painel administrativo com menu lateral próprio | `app/(app)/admin/layout.tsx` + `AdminSidebar` |
| Dashboard administrativo (usuários, Premium, conteúdos, redações, chat, comunidade, uso diário) | `/admin` + `lib/admin/stats.ts` |
| Gerenciamento de usuários (buscar, alterar plano, suspender/reativar) | `/admin/usuarios` + `lib/admin/users.ts` (+ `user_moderation`) |
| Gerenciamento da Biblioteca (criar/editar/excluir conteúdo, recorrência, temas) | `/admin/biblioteca` + `lib/admin/library.ts` |
| Aprovação de resumos enviados (publica na Biblioteca) | `/admin/resumos` (reusa `reviewSubmission` da Fase 7) |
| Gerenciamento da Comunidade | link para `/comunidade/admin` (Fase 7) |
| Visão geral das Redações | `/admin/redacoes` |
| Blog completo + editor (rascunho, publicar, agendar, excluir) | `/admin/blog` + `lib/blog/*` |
| SEO das páginas (title, description, OG, Twitter, canonical, metadataBase) | `app/layout.tsx` + metadata por página |
| SEO dos artigos (slug, keywords, seo_title/description, OG image, schema.org, breadcrumbs) | `app/(marketing)/blog/[slug]/page.tsx` |
| Sitemap automático + robots.txt | `app/sitemap.ts` + `app/robots.ts` |
| Blog monetizado (anúncio entre blocos) | `<AdSlot placement="blog_artigo">` |
| Analytics (páginas mais vistas, conteúdos, origem, sessão média, retenção) | `page_views` + `PageTracker` + `/admin/analytics` |
| Integração Google Analytics | `components/analytics/GoogleAnalytics.tsx` |
| Logs administrativos | `admin_logs` + `logAdmin()` (ligado às ações de admin) + `/admin/logs` |
| Configurações gerais (nome, descrição, contato, social, políticas, GA) | `site_config` + `/admin/config` |
| Notificações administrativas | agregadas no dashboard (`getAdminNotifications`) |
| Segurança | `requireAdmin()` no layout + RLS `is_app_admin()` no backend |

## Notas

- Exclusão física de usuário do `auth.users` requer o painel do Supabase / a
  service role; aqui "excluir" marca o usuário como banido (bloqueia o acesso).
- Publicação agendada: o artigo fica `agendado` com `scheduled_for`; a
  publicação efetiva no horário entra com o cron da Fase 10 (por ora, publique
  manualmente ou o filtro `published_at <= now()` já esconde futuros).
- Múltiplos níveis de permissão de admin (§19) ficam para evolução — hoje há um
  papel único (`app_admins`).
