# Fase 15 — IA adaptativa, memória evolutiva e roteamento de modelo

Fase final. Torna a IA da plataforma **adaptativa** (responde conforme o que já
sabe do aluno), dá à memória do aluno uma **evolução periódica** e introduz um
**roteador de modelo** que usa o modelo barato no comum e o forte quando o
pedido exige. Aditiva — nada das fases 2–14 muda de comportamento.

---

## 1. Migração

No **SQL Editor** do Supabase, depois de `0001`–`0013`… quer dizer, `0001`–`0012`:

```
supabase/migrations/0013_ia_adaptativa.sql
```

- **`ALTER chat_user_memory`** (aditivo): `evolved_summary`, `strengths[]`,
  `weaknesses[]`, `memory_version`, `interactions_since_evolve`, `last_evolved_at`.
- **`memory_snapshots`** — histórico versionado da memória (auditoria/rollback).
- Funções: `bump_memory_interactions`, `apply_memory_evolution`,
  `enqueue_due_memory_evolutions` (cron).
- Seed `site_config.model_routing` = `{}` (vazio → usa os padrões do código).

`types.ts` já foi estendido.

---

## 2. Roteamento de modelo (`lib/ai/routing.ts`)

`estimateComplexity()` calcula 0–100 a partir de profundidade, modo, tamanho do
texto, palavras-chave (“demonstre”, “prove”, “passo a passo”…), símbolos
matemáticos, imagens e rigor da banca.

`routeModel({ task, tier, complexity, live })` escolhe o modelo:

| Tarefa | Padrão |
| --- | --- |
| `chat` | `gpt-4o` se complexidade ≥ 70, senão `gpt-4o-mini` |
| `summary` | `gpt-4o` ≥ 55 |
| `questions` | `gpt-4o` ≥ 60 |
| `essay` | `gpt-4o` sempre (alta aposta) |
| `memory` | `gpt-4o-mini` sempre (destilação barata) |

Sem `OPENAI_API_KEY` → sempre `mock`. Sobrescreva por tarefa em
`site_config.model_routing` (JSON, cache de 2 min):

```json
{ "chat": [
    { "provider": "openai", "model": "o4-mini", "minComplexity": 65 },
    { "provider": "openai", "model": "gpt-4o-mini", "minComplexity": 0 }
] }
```

Onde já está ligado: `/api/chat` (`getRoutedChatProvider`) e a correção de
redação (`lib/redacao/correct.ts`, sempre no modelo forte). O modelo escolhido
é registrado em `ai_calls` (Fase 10) e no header `x-provider`.

---

## 3. Memória evolutiva (`lib/ai/memory-evolve.ts`)

`evolveMemory(userId)` reúne perguntas recentes do chat, erros de redação,
conteúdos marcados como difíceis e o objetivo do onboarding, e produz um perfil
enxuto: `summary`, `strengths[]`, `weaknesses[]`, `style`.

- **Com `OPENAI_API_KEY`**: chamada `task: "memory"` (modelo barato) devolve JSON.
- **Sem chave**: um resumo **determinístico** dos mesmos dados.
- Persistido por `apply_memory_evolution` → atualiza `chat_user_memory` e grava
  um `memory_snapshots` (versão + payload).

**Disparo:**
- `/api/chat` chama `bump_memory_interactions` e, a cada **15** interações,
  enfileira o job `memory_evolution` (dedupe por usuário).
- Cron: `enqueue_due_memory_evolutions()` agenda perfis com >7 dias e
  interações acumuladas.

O `evolved_summary` / `strengths` / `weaknesses` entram no **system prompt** do
chat (`memoryBlock` em `lib/ai/prompts.ts`).

---

## 4. IA adaptativa — "Plano de hoje"

`getAdaptivePlan(userId)` (`lib/ai/adaptive.ts`) sintetiza até 3 passos
priorizados: reforçar o maior ponto fraco → retomar uma leitura em andamento →
praticar (redação se o banco de erros pesa, senão questões). Renderizado no
dashboard por `<AdaptivePlanCard/>` (some enquanto não há sinal).

A correção de redação já usava o banco de erros (Fase 6); aqui ele também
alimenta o plano e a memória.

---

## 5. Admin

**`/admin/ia`** (novo item na sidebar): tabela de roteamento vigente + overrides,
consumo por provedor (30 d) e estatísticas de evolução de memória.

---

## 6. Cron

`/api/cron` ganhou o passo `memoryEvolutions` (`enqueue_due_memory_evolutions`).
Nenhuma configuração nova.

---

## 7. Checklist da fase

- [ ] `0013_ia_adaptativa.sql` rodou sem erro.
- [ ] Chat com pergunta simples → `x-provider: gpt-4o-mini`; pergunta com
      “demonstre passo a passo…” e modo detalhado → `gpt-4o`.
- [ ] Após ~15 mensagens no chat, aparece um job `memory_evolution` na fila e,
      processado, `chat_user_memory.memory_version` incrementa + snapshot criado.
- [ ] Dashboard mostra o "Plano de hoje" depois de alguma atividade.
- [ ] `/admin/ia` abre e lista o roteamento.
- [ ] Sem `OPENAI_API_KEY`: chat/memória funcionam em modo mock/determinístico.
- [ ] `npm run check` verde.
