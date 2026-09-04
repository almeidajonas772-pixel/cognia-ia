# Fase 3 — Biblioteca ENEM

Módulo independente. **Não altera** as Fases 1 e 2. Progresso e favoritos
reaproveitam as tabelas `progress` e `favorites` da Fase 2.

---

## 1. Rodar a migração

No **SQL Editor** do Supabase, cole e execute
[`supabase/migrations/0002_biblioteca.sql`](../supabase/migrations/0002_biblioteca.sql)
(depois do `0001_init.sql`).

Cria as tabelas `library_subjects`, `library_topics`, `library_contents`,
`library_content_premium`, `library_reading_history`, a função
`public.is_premium()` e as políticas de RLS.

## 2. Popular o catálogo

O conteúdo vive em `content/biblioteca/`:

- `manifest.mjs` — estrutura (matérias → temas → conteúdos), recorrência ENEM e
  o **resumo rápido** (grátis) de cada conteúdo.
- `*.md` — o **resumo completo** (Premium) de cada conteúdo, no padrão dos guias
  de estudo (definição → função → consequência, tabelas comparativas,
  pegadinhas, 20 questões + gabarito comentado).
- Diagramas SVG autorais (sem direitos autorais) em `public/img/biblioteca/`,
  referenciados nos `.md` com `![alt](/img/biblioteca/arquivo.svg "legenda")`.
  Renderizam como `<figure>` com legenda, com painel escuro próprio para ficar
  legível em qualquer fundo. (No app; a exportação `.doc` ainda é texto simples.)

O `.env.local` precisa ter `SUPABASE_SERVICE_ROLE_KEY` (além da URL). Então:

```bash
npm install
npm run seed:biblioteca
```

O script faz **upsert** — pode rodar quantas vezes quiser. Saída esperada:

```
  ✓ História › Brasil República › Era Vargas (1930–1945)
  ...
✓ Seed concluído: 7 matérias, 9 temas, 10 conteúdos.
```

## 3. Adicionar / editar conteúdo

1. Edite `content/biblioteca/manifest.mjs` (nova matéria/tema/conteúdo).
2. Crie o `.md` do resumo completo referenciado em `premiumFile`.
3. (Opcional) Adicione diagramas em `public/img/biblioteca/` e referencie no `.md`.
4. `npm run seed:biblioteca` — reexecute sempre que editar um `.md`.

Na Fase 9, isso passa a ser feito pelo painel administrativo.

---

## Como funciona

| Recurso                       | Onde                                                        |
| ---------------------------- | ------------------------------------------------------- |
| Rotas                         | `/biblioteca` → `/biblioteca/[materia]` → `/biblioteca/[materia]/[conteudo]` (máx. 3 cliques) |
| Resumo rápido                  | sempre visível (campo `summary_short`)                     |
| Resumo completo                | só Premium — RLS `library_premium_read` + checagem no app  |
| Recorrência ENEM               | 🔴 muito recorrente · 🟠 recorrente · 🟡 ocasional · 🟢 raro (badge + filtro) |
| Marcar como concluído          | grava em `progress` (`subject` = slug da matéria, `topic` = slug do conteúdo) |
| Favoritar                      | grava em `favorites` (`item_type = 'library_content'`)     |
| Continuar de onde parou        | `library_reading_history` (atualizado ao abrir um conteúdo) |
| Busca                          | `/biblioteca/busca?q=` (por título)                         |
| Progresso                      | geral (hub) e por matéria (página da matéria)              |
| Download `.doc`                | `/biblioteca/[materia]/[conteudo]/download` — só Premium    |

Limites diários de navegação e anúncios ficam para a **Fase 8**.
