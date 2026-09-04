# Fase 4 — Chat Inteligente Educacional

Módulo independente. Consome auth (Fase 2), Biblioteca (Fase 3) e plano do
usuário. **Não altera** as fases anteriores (só adiciona tipos e uma migração).

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0003_chat.sql`](../supabase/migrations/0003_chat.sql)
(depois de 0001 e 0002).

Cria `chat_conversations`, `chat_messages`, `chat_user_memory`, `chat_usage`,
as funções `bump_chat_usage()` / `touch_conversation()` e as políticas de RLS.
A tabela `chat_history` da Fase 2 continua intacta (não é mais usada).

## 2. Chaves de IA (opcional)

Sem chave nenhuma, o chat funciona em **modo demonstração**: a interface
inteira roda, mas as respostas são esqueletos rotulados como tal.

No `.env.local`:

```
OPENAI_API_KEY=sk-...              # chat, resumos, questões
OPENAI_CHAT_MODEL=gpt-4o-mini     # opcional
GEMINI_API_KEY=...                # análise de imagem
```

- Com `OPENAI_API_KEY` → chat/resumos/questões passam a usar a OpenAI.
- Com `GEMINI_API_KEY` → upload de imagem passa a ser analisado de verdade.

## 3. Rodar

```bash
npm install   # adiciona react-markdown / remark-gfm (já usados na Fase 3)
npm run dev
```

`/chat` → nova conversa. `/chat/[id]` → conversa (streaming).

---

## O que está implementado (spec Fase 4)

| Item | Onde |
| --- | --- |
| Chat educacional com streaming | `app/api/chat/route.ts` + `components/chat/ChatThread.tsx` |
| Formato (professor/simples/detalhado/resumo/prova) e profundidade | `ModeDepth` + `chat_conversations.mode/depth` |
| Resumos personalizados (nível, formato, recursos) | `app/api/chat/summary` + `GenerateDialog` |
| Geração de questões estilo ENEM (enunciado + alternativas + gabarito comentado) | `app/api/chat/questions` |
| Análise de imagem (upload no compositor) | rota `/api/chat` com `images[]` → Gemini/mock |
| Memória inteligente por usuário | `chat_user_memory` + `lib/chat/memory.ts` (heurística) + injeção no system prompt |
| Integração com a Biblioteca | `listContentsBrief()` no system prompt → recomendações com link real |
| Histórico: salvar, buscar, retomar, favoritar resposta | `chat_messages` + sidebar + busca + `toggleFavoriteMessage` |
| Regras de qualidade/segurança | `lib/ai/prompts.ts` (`QUALITY_RULES`) |
| Controle por plano (limites diários) | `lib/chat/limits.ts` + `chat_usage` + `LimitDialog` |
| Multi-provedor com fallback | `lib/ai/` (openai / gemini / mock) |

## Notas de arquitetura

- **"Manus IA"** do documento original: a Manus é um agente interativo, não uma
  API de produção para gerar conteúdo em escala. O caminho "long-form"
  (resumos) usa o mesmo provedor de chat. Trocar o modelo é só mudar
  `OPENAI_CHAT_MODEL` ou adicionar um provedor em `lib/ai/providers/`.
- **Geração de imagens educacionais** (spec §5) fica para uma fase futura —
  exige provedor de imagem e uma política de moderação própria. A estrutura de
  provedores já comporta um `ImageGenProvider`.
- Limites: hoje centralizados em `lib/chat/limits.ts`. Na **Fase 8** migram para
  o painel administrativo.
