# Fase 5 — Progresso, Favoritos e Analytics

Módulo independente. Reaproveita `progress` / `favorites` (Fase 2),
`library_reading_history` (Fase 3) e `chat_*` (Fase 4) sem alterá-las.

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0004_progresso.sql`](../supabase/migrations/0004_progresso.sql)
(depois de 0001–0003).

Cria `activity_log` (histórico unificado), `study_sessions` + `study_daily`
(tempo de estudo), `content_difficulty` (dificuldade percebida) e as funções
`log_activity()` / `study_ping()` com RLS.

## 2. Rodar

```bash
npm run dev
```

Nada de novo no `.env`. O tempo de estudo começa a ser contado assim que uma
página do app fica aberta (`components/progresso/StudyHeartbeat.tsx` → ping a
cada minuto → `/api/study/ping`).

---

## O que foi implementado (spec Fase 5)

| Item | Onde |
| --- | --- |
| Progresso geral / por matéria / por conteúdo | `lib/progresso/queries.ts` (`computeOverall`, `computeSubjectMastery`) |
| Nível de domínio estimado | `mastery` = conclusão ajustada por dificuldade percebida e falta de revisão |
| Tempo de estudo + evolução no tempo | `study_daily` + heartbeat; gráficos SVG em `components/progresso/Charts.tsx` |
| Sequência (streak) de dias | `getStudyStats` |
| Dificuldade percebida por conteúdo | `content_difficulty` + `DifficultyRating` na página do conteúdo |
| Favoritos (biblioteca + respostas da IA), busca e categorias | `lib/progresso/favorites.ts` + `FavoritesList` + página `/favoritos` |
| Histórico unificado com filtros por data/matéria/tipo | `activity_log` + `getTimeline` + página `/historico` |
| Analytics: mapa de desempenho, detecção de fraquezas | `computeWeakSpots` + Dashboard (Premium) |
| Recomendações inteligentes | `lib/progresso/recommendations.ts` (estudar / revisar / praticar / simulado) |
| Dashboard evoluído | `app/(app)/dashboard/page.tsx` (reescrito) |
| Integração com Biblioteca | `recordContentView` / `setContentCompleted` gravam em `activity_log`; conclusão reflete no progresso |
| Integração com Chat | `updateMemoryHeuristic` grava pontos fracos/fortes em `chat_user_memory.notes`, lidos no próximo turno |
| Regras de plano | `lib/progresso/limits.ts` — grátis: progresso básico, 20 favoritos, histórico 14 dias, sem analytics avançado |

## Notas

- `study_ping` deduplica múltiplas abas (soma no máximo 2 min por chamada) e
  limita o dia a 900 min.
- `user_analytics` do documento original é calculado sob demanda a partir de
  `activity_log` + `study_daily` (índices por usuário). Um rollup dedicado pode
  entrar depois se o volume exigir.
- A base para "estudo adaptativo" (spec §12) já existe: dificuldade percebida +
  domínio por matéria + memória do chat alimentada pelo progresso.
