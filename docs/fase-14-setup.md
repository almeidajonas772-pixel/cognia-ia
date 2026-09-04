# Fase 14 — Crescimento, Retenção e Indicação

Gamificação (XP, níveis, sequência, conquistas), retenção (recap semanal e
nudges de inatividade) e programa de indicação. Aditiva — nada das fases 2–13
muda de comportamento.

---

## 1. Migração

No **SQL Editor** do Supabase, depois de `0001`–`0012`:

```
supabase/migrations/0012_crescimento.sql
```

| Objeto | Papel |
| --- | --- |
| `user_gamification` | xp, nível, streak atual/recorde, proteções de sequência, meta semanal |
| `xp_events` | ledger de XP (idempotente por `(user_id, kind, dedupe_key)`) |
| `user_achievements` | conquistas desbloqueadas (o catálogo fica em `lib/gamification/achievements.ts`) |
| `referral_codes` / `referrals` | código por usuário + vínculos indicador↔indicado |
| `level_for_xp`, `grant_xp`, `touch_streak` | curva de nível, concessão idempotente, streak |
| `get_or_create_referral_code`, `record_referral`, `qualify_referral` | fluxo de indicação |
| `notify_user`, `run_growth_maintenance` | notificações de sistema + rotina de retenção (cron) |

RLS: tudo é do próprio usuário (+ admin lê). Concessões de XP e vínculos passam
por funções `security definer`.

`types.ts` já foi estendido.

---

## 2. Como o XP é concedido

| Ação | XP | Onde |
| --- | --- | --- |
| Dia ativo (1º ping do dia) | 15 | `/api/study/ping` → `awardXp('daily_active', …, dedupe='daily:AAAA-MM-DD')` |
| Concluir onboarding | 50 | `completeOnboarding` (Fase 13) |
| Conquista desbloqueada | +25 | `syncAchievements` (idempotente por conquista) |
| Indicação qualificada | 300 (indicador) / 150 (indicado) | `qualify_referral` |

`grant_xp` recalcula o nível na hora (`level_for_xp`: nível N exige `50·N·(N-1)`
XP → nível 2 = 100, 3 = 300, 5 = 1000…). Ganchos adicionais (leitura de
conteúdo, redação, chat…) são triviais de ligar: chame
`onActivity(userId, { kind, amount, dedupe })` de `lib/gamification/award.ts`.

---

## 3. Sequência (streak)

`touch_streak` roda a cada ping (retorna cedo se já marcou hoje):

- dia consecutivo → `+1`
- 1 dia perdido **com** proteção (`streak_freezes > 0`) → consome a proteção e mantém
- mais que isso → volta a `1`

Proteções ganham-se via indicação qualificada (+1 para ambos).

---

## 4. Conquistas

16 conquistas em `lib/gamification/achievements.ts` (bronze/prata/ouro),
avaliadas por `syncAchievements` a partir de contagens (`activity_log`,
`essay_submissions`, `chat_messages`, `community_group_posts`, `referrals`,
`user_gamification`). O `StudyHeartbeat` dispara o toast `<AchievementToast/>`
quando o ping retorna novas conquistas.

---

## 5. Indicação

1. O link `…/cadastro?ref=CÓDIGO` → `<RefCapture/>` grava o cookie `cogni_ref` (30 dias).
2. No onboarding (`/bem-vindo`), `redeemReferralOnSignup` chama `record_referral`
   (idempotente, ignora auto-indicação e quem já foi indicado).
3. Ao **concluir o onboarding**, `qualify_referral` marca a indicação como
   `rewarded` e concede XP + proteção de sequência a ambos.

Páginas: **`/convidar`** (link, métricas, histórico) e a chamada em
**`/conquistas`**.

Anti-abuso: `referrals.referred_id` é `unique`; auto-indicação bloqueada no SQL;
recompensa só após o marco de qualificação.

---

## 6. Retenção (cron)

`/api/cron` (a cada 5 min) chama `run_growth_maintenance`, que:

- **Nudges**: usuários inativos há exatamente 3 ou 7 dias, no máx. 1 a cada 7
  dias (`user_gamification.last_nudge_date`) → notificação em
  `community_notifications` (`kind = 'nudge'`).
- **Recap semanal**: segundas-feiras, uma vez (marcador em
  `site_config.growth_state`) → notificação `kind = 'recap'` com minutos de
  estudo, XP e sequência da semana.

Nenhuma configuração nova — reusa o `CRON_SECRET` da Fase 10.

---

## 7. UI

| Onde | O quê |
| --- | --- |
| Dashboard | `<GamificationCard/>` (nível, XP, sequência, meta semanal) |
| Sidebar / MobileNav | item **Conquistas** (`/conquistas`) |
| `/conquistas` | níveis, meta semanal ajustável, grade de conquistas, ranking semanal anônimo |
| `/convidar` | painel de indicação |
| Toast global | `<AchievementToast/>` no layout do app |

O ranking mostra só **"Você"** identificável; os demais são "Estudante N".

---

## 8. Checklist da fase

- [ ] `0012_crescimento.sql` rodou sem erro.
- [ ] Abrir o app por >1 min → `/api/study/ping` concede 15 XP e cria a
      sequência; `<GamificationCard/>` reflete.
- [ ] Concluir o onboarding → +50 XP e conquista "Primeiro passo" (toast).
- [ ] `/conquistas` abre; ajustar a meta semanal persiste.
- [ ] `/convidar` mostra o link `?ref=`; abrir esse link noutro navegador,
      cadastrar e concluir o onboarding → `referrals` vira `rewarded`, ambos
      ganham XP.
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron` →
      `growthMaintenance` presente na resposta.
- [ ] `npm run check` verde.
