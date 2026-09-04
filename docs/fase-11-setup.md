# Fase 11 — Segurança, Privacidade e LGPD

Camada transversal. Endurece a plataforma e dá ao usuário controle sobre os
próprios dados. **Nada das fases 2–10 muda de comportamento** — tudo é aditivo
e degrada com elegância sem as variáveis opcionais.

---

## 1. Migração

No **SQL Editor** do Supabase, depois de `0001`–`0009`:

```
supabase/migrations/0010_seguranca.sql
```

| Tabela | Papel |
| --- | --- |
| `user_security` | MFA on/off, `sessions_valid_after` (logout global), agendamento de exclusão |
| `user_sessions` | dispositivos conhecidos (UA, hash de IP, `iat` do token, último acesso) |
| `user_consent` | consentimento de cookies/analytics/marketing + versão dos termos |
| `security_events` | trilha de auditoria append-only (login, MFA, revogação, export, exclusão, rate limit…) |
| `data_exports` | pedidos de exportação de dados (processados pela fila da Fase 10) |

Funções (todas `security definer`): `ensure_user_security`, `log_security_event`,
`revoke_all_sessions`, `revoke_session`, `request_account_deletion`,
`cancel_account_deletion`, `purge_due_deletions` (cron), `expire_due_exports`
(cron), `set_user_consent`.

RLS: cada usuário só enxerga as próprias linhas; admins têm leitura via
`is_app_admin()`. Escritas sensíveis passam por RPC ou service role.

`lib/supabase/types.ts` já foi estendido (tabelas + funções + `DataExportStatusValue`).

---

## 2. Bucket de Storage

Crie um bucket **privado** chamado **`exports`** (Storage → New bucket).
É onde os pacotes JSON de exportação de dados ficam, com validade de 7 dias e
download por URL assinada de 5 min.

---

## 3. Variáveis de ambiente (opcionais)

```bash
APP_ENCRYPTION_KEY=      # >= 32 chars. openssl rand -hex 32
IP_HASH_SECRET=          # opcional; senão usa APP_ENCRYPTION_KEY
```

- `APP_ENCRYPTION_KEY` alimenta `lib/security/crypto.ts` (AES-256-GCM para
  cifra de coluna e derivação do **hash de IP**). Sem ela, as funções que
  cifram **lançam** (nunca cifram fraco) e o hash de IP retorna `null` — o
  resto do app roda normalmente, apenas sem guardar IP nem colunas cifradas.
- `CRON_SECRET` (já da Fase 10) passa a proteger também as rotinas de purga.

---

## 4. Rate limiting

`lib/security/rate-limit.ts` — janela fixa sobre o cache KV da Fase 10
(memória em dev, **Upstash Redis** compartilhado em produção). Se o cache
falhar, o limiter **libera** (disponibilidade > precisão).

`enforceRate(req, bucket, RATE_RULES.x, userId?)` devolve `null` (ok) ou uma
resposta `429` pronta. Já aplicado em:

| Rota | Regra |
| --- | --- |
| `/api/chat` | `ai` (30/min) |
| `/api/chat/summary`, `/api/chat/questions` | `aiHeavy` (8/min) |
| `/api/redacao/ocr`, `/api/redacao/[id]/corrigir` | `aiHeavy` |
| `/api/upload` | `upload` (12/min) |
| `/api/privacy/consent` | `mutation` |
| `/api/privacy/export/[id]` | `privacy` (5/h) |

Estouros geram um `security_events` com `event = rate_limited`.

---

## 5. Sessões e logout global

- Cada aba registra a sessão uma vez (`<SessionSync/>` → `/api/security/session`);
  o callback de OAuth também registra.
- `/perfil/seguranca` lista os dispositivos e permite **encerrar** um ou
  **sair de todos** (`revoke_all_sessions` grava `sessions_valid_after = now()`).
- O layout do app (`app/(app)/layout.tsx`) recusa qualquer access token cujo
  `iat` seja anterior a `sessions_valid_after` — mesma ideia do
  `user_is_blocked` da Fase 9. A checagem é cacheada ~30 s por usuário.

---

## 6. 2FA (TOTP)

`/perfil/seguranca` → **Ativar 2FA**. Usa a API nativa `supabase.auth.mfa.*`
(enroll → QR → verify). A Server Action `syncMfaState` espelha o resultado em
`user_security.mfa_enabled` e audita. Sem Supabase conectado, o cartão mostra
"indisponível".

> Para **exigir** o segundo fator no login (AAL2) em vez de só oferecê-lo,
> configure a policy de MFA no painel do Supabase (Authentication → MFA) —
> a UI aqui já cobre o enrolamento.

---

## 7. LGPD — direitos do titular

`/perfil/privacidade`:

- **Consentimento** — liga/desliga analytics e marketing; grava em
  `user_consent` **e** no cookie `cogni_consent`. O Google Analytics
  (`<ConsentedAnalytics/>`) só carrega com `analytics = true`.
- **Exportar meus dados** — cria um `data_exports`, enfileira o job
  `data_export` (Fase 10), que junta tudo (`lib/privacy/collect.ts`), grava um
  JSON no bucket `exports` e libera o download por 7 dias.
- **Excluir conta** — `request_account_deletion` agenda para +30 dias; até lá
  o app fica bloqueado com opção de **cancelar**. O cron `purge_due_deletions`
  remove de `public.users` + `auth.users` (cascata apaga todo o resto).

Banner de cookies (`<CookieConsent/>`) aparece no primeiro acesso; páginas
públicas [`/privacidade`](/privacidade) e [`/termos`](/termos).

---

## 8. Auditoria

`lib/security/audit.ts` → `security_events`. Visível ao usuário em
`/perfil/seguranca` e ao admin em **`/admin/seguranca`** (eventos recentes,
exclusões agendadas, exportações na fila, hits de rate limit em 24 h).

---

## 9. Cabeçalhos de segurança

`next.config.mjs` → `headers()`:

- `Strict-Transport-Security`, `Permissions-Policy` (camera/mic/geo/topics off).
- **`Content-Security-Policy-Report-Only`** — política completa em modo
  observação (não quebra nada). Para reforçar, trocar por
  `Content-Security-Policy` com nonce por request.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` (já da Fase 10).

---

## 10. Cron

`/api/cron` (Fase 10) ganhou dois passos: `purge_due_deletions` e
`expire_due_exports`. Nenhuma ação nova de agendamento necessária.

---

## 11. Checklist

- [ ] `0010_seguranca.sql` rodou sem erro.
- [ ] Bucket privado `exports` criado.
- [ ] `/perfil/seguranca` abre: 2FA, dispositivos, atividade.
- [ ] `/perfil/privacidade` abre: consentimento, exportação, exclusão.
- [ ] Solicitar exportação → job conclui → download funciona.
- [ ] "Sair de todos os dispositivos" → recarregar → tela "Sessão encerrada".
- [ ] Agendar exclusão → app bloqueia com "cancelar" → cancelar restaura.
- [ ] Banner de cookies aparece; recusar análise mantém o GA fora.
- [ ] Passar do limite em `/api/chat` várias vezes → `429` + evento no
      `/admin/seguranca`.
- [ ] `npm run typecheck` limpo.
