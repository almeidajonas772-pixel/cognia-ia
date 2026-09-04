# Fase 7 — Comunidade de Estudos

Módulo independente. Ambiente focado só em estudo (spec §17). Integra Chat
(enviar resumo), Biblioteca (publicar aprovados), Favoritos (Fase 5) e Histórico.

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0006_comunidade.sql`](../supabase/migrations/0006_comunidade.sql)
(depois de 0001–0005).

Cria grupos + membros + publicações + curtidas + comentários + denúncias +
fila de resumos + notificações + `app_admins`, com RLS e triggers de contagem.
Já semeia **13 grupos oficiais** (ENEM 2026, matérias, cursos, concursos).

> A 1ª linha (`alter type ... add value 'community'`) amplia o histórico da
> Fase 5. Se o editor recusar por bloco transacional, rode-a isolada.

## 2. Definir um administrador (spec §11)

O painel `/comunidade/admin` (moderar publicações, resolver denúncias, aprovar
resumos para a Biblioteca) exige estar em `app_admins`:

```sql
insert into public.app_admins (user_id)
select id from auth.users where email = 'seu-email@exemplo.com';
```

## 3. Rodar

```bash
npm run dev
```

`/comunidade` → entrar em grupos → publicar / comentar / curtir / salvar.

---

## O que foi implementado (spec Fase 7)

| Item | Onde |
| --- | --- |
| Grupos públicos/privados, entrar/sair, criar novos | `community_groups` + `JoinButton` + `createGroup` |
| Publicações (7 tipos), anexos por link, referência a conteúdo | `community_group_posts` + `PostComposer` |
| Comentários com respostas (1 nível), editar/excluir | `community_comments` + `CommentThread` |
| Curtidas (+ arquitetura para reações futuras) | `community_post_likes` |
| Salvar publicação | `favorites` (`item_type = community_post`) — integra Fase 5 |
| Busca + filtros (recentes / curtidos / comentados / tipo) | `getGroupPosts` + query params |
| Moderação automática antes de publicar | `lib/comunidade/moderation.ts` (heurística + IA) |
| Denúncias | `community_reports` + `ReportDialog` |
| Área administrativa | `/comunidade/admin` — aprovar/remover, resolver denúncia, fila de resumos |
| Resumo do Chat → Biblioteca | `SendToLibraryButton` no chat → `community_library_submissions` → `reviewSubmission` publica com layout padronizado e sem dados pessoais |
| Conteúdos oficiais e fixados, com destaque | `official` / `pinned` + `adminSetPostFlag` |
| Notificações | `community_notifications` + sino na topbar + `/comunidade/notificacoes` |
| Limites por plano | `communityLimits` (grátis: 8 posts/dia; premium: grupos privados, mais upload) |
| Segurança | RLS por papel (`is_group_staff`, `is_app_admin`), rate limit de posts, moderação, sanitização de links |

## Fora do escopo desta fase (vai para a Fase 9)

- Suspender / bloquear usuário (gestão de usuários completa).
- Perfil público de usuário com privacidade granular (§15/§16) — hoje o autor
  aparece com nome + avatar apenas.
- Fan-out de "nova publicação em grupo favorito" para todos os membros
  (precisa de fila; hoje notifica só respostas e destaques).
- Upload de arquivo (PDF/Word/imagem) — hoje anexo é por link, validado.
