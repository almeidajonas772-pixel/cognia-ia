# Fase 8 — Assinaturas, Monetização e Controle de Acesso

Módulo independente. Mantém `users.plan` como **cache** do direito de acesso,
sincronizado a partir de `subscriptions` — por isso todos os gates das fases
anteriores (que leem `profile.plan`) continuam válidos.

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0007_billing.sql`](../supabase/migrations/0007_billing.sql)
(depois de 0001–0006).

Cria `subscriptions`, `payments`, `coupons` (+ `coupon_redemptions`),
`billing_config` (limites + anúncios editáveis), `billing_events` (log),
`feature_usage` (contadores centralizados) e as funções de plano com
**proteção contra alteração manual** (spec §13): a ativação só ocorre via
`activate_subscription()` (usa `auth.uid()`) ou pelo webhook (service role).

## 2. Mercado Pago (opcional)

- Sem `MERCADOPAGO_ACCESS_TOKEN` → **modo demonstração**: o checkout leva a
  `/perfil/assinatura/confirmar`, onde um clique ativa o Premium (útil para
  testar limites, anúncios e o painel).
- Com o token → `POST /api/billing/checkout` cria uma *preapproval* (assinatura
  recorrente) e redireciona ao Mercado Pago. O webhook
  `/api/billing/webhook?secret=…` ativa/cancela conforme o evento.

`.env.local`:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=uma-string-secreta
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...   # exigido pelo webhook
```

## 3. Rodar

```bash
npm run dev
```

- `/precos` — Comparar Planos (público) + assinar
- `/perfil/assinatura` — Minha Assinatura (status, renovação, cancelar, trocar ciclo, histórico)
- `/admin/monetizacao` — painel (exige `app_admins`, ver Fase 7)

---

## O que foi implementado (spec Fase 8)

| Item | Onde |
| --- | --- |
| Planos Gratuito / Premium (R$ 14,90/mês · R$ 119,90/ano) | `lib/billing/config.ts` |
| Controle central de permissões (backend) | `lib/billing/entitlements.ts` — `getEntitlements` / `checkFeature` / `consumeFeature` |
| Limites centralizados e **configuráveis pelo admin** | `billing_config.plan_limits` + editor no painel |
| Assinaturas + Mercado Pago (real + simulado) + Webhooks | `lib/billing/provider.ts` + `/api/billing/*` |
| Renovação automática, cancelamento, troca de ciclo, reativação | funções SQL + `SubscriptionActions` |
| Página "Minha Assinatura" | `/perfil/assinatura` |
| Página "Comparar Planos" (visitante e logado) | `/precos` + `PlanComparison` |
| Tela de limite com a cópia oficial | `UpgradeDialog` (`UPGRADE_COPY`) |
| Anúncios só para gratuitos, por placement permitido | `lib/ads/` + `<AdSlot>` (biblioteca, comunidade, busca, blog, fim de simulado, conteúdo público) |
| Anúncios nativos / afiliados / patrocinadores | `NATIVE_ITEMS` + `SponsorSlot` — estrutura pronta para links de afiliado |
| Cupons (código, %, valor fixo, validade, limites, plano, status) | `coupons` + `previewCoupon` + gestão no painel |
| Painel de monetização + Dashboard financeiro (MRR, ARR, churn, ticket, conversão) | `/admin/monetizacao` + `lib/billing/stats.ts` |
| Log de eventos de cobrança | `billing_events` |
| Expiração de assinaturas vencidas | `expire_due_subscriptions()` (cron entra na Fase 10) |

## Notas

- O gate de **resumos (2/semana)** já usa o motor central (`resumo_semanal`).
  Chat/questões continuam nos contadores da Fase 4; a migração completa desses
  gates para `checkFeature` é incremental e sem impacto no usuário.
- Blog monetizado (§10): o `<AdSlot placement="blog_artigo">` está pronto; o
  Blog em si é da Fase 9.
- Verificação HMAC completa do `x-signature` do Mercado Pago: o webhook hoje
  valida por segredo compartilhado; adicione a checagem de assinatura quando
  usar credenciais de produção.
