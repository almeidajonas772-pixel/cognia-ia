-- ============================================================================
-- COGNI IA — Fase 7: Comunidade de Estudos
-- Módulo independente. NÃO altera as fases anteriores.
-- A tabela `community_posts` da Fase 2 permanece intacta; a Fase 7 usa
-- `community_group_posts` (posts dentro de grupos).
--
-- Rodar no SQL Editor DEPOIS de 0001–0005.
-- ============================================================================

-- Amplia o histórico da Fase 5 para incluir atividade de comunidade.
-- (ALTER TYPE ADD VALUE roda fora de bloco transacional; se falhar, rode esta
--  linha isolada primeiro.)
alter type public.activity_kind add value if not exists 'community';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_visibility') then
    create type public.group_visibility as enum ('publica', 'privada');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('membro', 'moderador', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'post_kind') then
    create type public.post_kind as enum (
      'duvida', 'explicacao', 'resumo', 'material', 'noticia', 'discussao', 'dica'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type public.moderation_status as enum (
      'aprovado', 'pendente', 'bloqueado', 'revisao'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum (
      'spam', 'ofensa', 'improprio', 'falso', 'propaganda', 'outro'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'report_target') then
    create type public.report_target as enum ('post', 'comment', 'material');
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum (
      'pendente', 'aprovado', 'reprovado', 'ajustes'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ADMIN DA PLATAFORMA (spec §11) — sem tocar em `public.users`
-- ---------------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id     uuid primary key references public.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.app_admins enable row level security;
drop policy if exists app_admins_read on public.app_admins;
create policy app_admins_read on public.app_admins
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- GRUPOS (spec §2)
-- ---------------------------------------------------------------------------
create table if not exists public.community_groups (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  image_url     text,
  category      text not null default 'Geral',
  visibility    public.group_visibility not null default 'publica',
  rules         text,
  official      boolean not null default false,
  created_by    uuid references public.users (id) on delete set null,
  member_count  int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists community_groups_set_updated_at on public.community_groups;
create trigger community_groups_set_updated_at
  before update on public.community_groups
  for each row execute function public.set_updated_at();

create table if not exists public.community_group_members (
  group_id   uuid not null references public.community_groups (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  role       public.member_role not null default 'membro',
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists community_group_members_user_idx
  on public.community_group_members (user_id);

create or replace function public.community_member_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.community_groups set member_count = member_count + 1 where id = new.group_id;
  elsif tg_op = 'DELETE' then
    update public.community_groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
  end if;
  return null;
end;
$$;
drop trigger if exists community_member_count_trg on public.community_group_members;
create trigger community_member_count_trg
  after insert or delete on public.community_group_members
  for each row execute function public.community_member_count();

-- staff = criador do grupo, moderador/admin do grupo, ou admin da plataforma
create or replace function public.is_group_staff(p_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    exists (select 1 from public.community_groups g
            where g.id = p_group and g.created_by = auth.uid())
    or exists (select 1 from public.community_group_members m
               where m.group_id = p_group and m.user_id = auth.uid()
                 and m.role in ('moderador', 'admin'))
    or public.is_app_admin();
$$;

create or replace function public.is_group_member(p_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.community_group_members
    where group_id = p_group and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- PUBLICAÇÕES (spec §3) + CURTIDAS (§5) + COMENTÁRIOS (§4)
-- ---------------------------------------------------------------------------
create table if not exists public.community_group_posts (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.community_groups (id) on delete cascade,
  user_id        uuid not null references public.users (id) on delete cascade,
  kind           public.post_kind not null default 'discussao',
  title          text not null,
  content        text not null,
  attachments    jsonb not null default '[]'::jsonb,   -- [{type,url,name}]
  source_ref     jsonb,                                -- {type:'biblioteca'|'chat'|'redacao', href, label}
  official       boolean not null default false,
  pinned         boolean not null default false,
  moderation     public.moderation_status not null default 'aprovado',
  moderation_note text,
  like_count     int not null default 0,
  comment_count  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists community_posts_group_idx
  on public.community_group_posts (group_id, pinned desc, created_at desc);
create index if not exists community_posts_user_idx
  on public.community_group_posts (user_id, created_at desc);
create index if not exists community_posts_mod_idx
  on public.community_group_posts (moderation);
create index if not exists community_posts_search_idx
  on public.community_group_posts using gin
  (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, '')));

drop trigger if exists community_group_posts_set_updated_at on public.community_group_posts;
create trigger community_group_posts_set_updated_at
  before update on public.community_group_posts
  for each row execute function public.set_updated_at();

create table if not exists public.community_post_likes (
  post_id     uuid not null references public.community_group_posts (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.community_like_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.community_group_posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_group_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists community_like_count_trg on public.community_post_likes;
create trigger community_like_count_trg
  after insert or delete on public.community_post_likes
  for each row execute function public.community_like_count();

create table if not exists public.community_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.community_group_posts (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  parent_id    uuid references public.community_comments (id) on delete cascade,
  content      text not null,
  moderation   public.moderation_status not null default 'aprovado',
  edited       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at);

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

create or replace function public.community_comment_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.moderation = 'aprovado' then
    update public.community_group_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' and old.moderation = 'aprovado' then
    update public.community_group_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists community_comment_count_trg on public.community_comments;
create trigger community_comment_count_trg
  after insert or delete on public.community_comments
  for each row execute function public.community_comment_count();

-- ---------------------------------------------------------------------------
-- DENÚNCIAS (spec §10)
-- ---------------------------------------------------------------------------
create table if not exists public.community_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.users (id) on delete cascade,
  target_type  public.report_target not null,
  target_id    uuid not null,
  reason       public.report_reason not null,
  detail       text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists community_reports_open_idx
  on public.community_reports (resolved, created_at desc);

-- ---------------------------------------------------------------------------
-- FILA: RESUMO DA COMUNIDADE → BIBLIOTECA (spec §12)
-- ---------------------------------------------------------------------------
create table if not exists public.community_library_submissions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users (id) on delete cascade,
  title                 text not null,
  content               text not null,
  suggested_subject     text,
  suggested_topic       text,
  source_conversation_id uuid,
  status                public.submission_status not null default 'pendente',
  admin_note            text,
  reviewed_by           uuid references public.users (id) on delete set null,
  published_content_id  uuid references public.library_contents (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists community_submissions_status_idx
  on public.community_library_submissions (status, created_at);

drop trigger if exists community_submissions_set_updated_at on public.community_library_submissions;
create trigger community_submissions_set_updated_at
  before update on public.community_library_submissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- NOTIFICAÇÕES (spec §14)
-- ---------------------------------------------------------------------------
create table if not exists public.community_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  kind        text not null,
  title       text not null,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists community_notifications_user_idx
  on public.community_notifications (user_id, read, created_at desc);

-- Cria notificação para outro usuário (contorna a RLS de INSERT).
create or replace function public.community_notify(
  p_user uuid, p_kind text, p_title text, p_href text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null or p_user = auth.uid() then return; end if;
  insert into public.community_notifications (user_id, kind, title, href)
  values (p_user, p_kind, p_title, p_href);
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.community_groups              enable row level security;
alter table public.community_group_members       enable row level security;
alter table public.community_group_posts         enable row level security;
alter table public.community_post_likes          enable row level security;
alter table public.community_comments            enable row level security;
alter table public.community_reports             enable row level security;
alter table public.community_library_submissions enable row level security;
alter table public.community_notifications       enable row level security;

-- Grupos
drop policy if exists community_groups_read on public.community_groups;
create policy community_groups_read on public.community_groups
  for select to authenticated using (true);
drop policy if exists community_groups_insert on public.community_groups;
create policy community_groups_insert on public.community_groups
  for insert to authenticated with check (created_by = auth.uid());
drop policy if exists community_groups_write on public.community_groups;
create policy community_groups_write on public.community_groups
  for update to authenticated
  using (public.is_group_staff(id)) with check (public.is_group_staff(id));
drop policy if exists community_groups_delete on public.community_groups;
create policy community_groups_delete on public.community_groups
  for delete to authenticated using (public.is_app_admin());

-- Membros
drop policy if exists community_members_read on public.community_group_members;
create policy community_members_read on public.community_group_members
  for select to authenticated using (true);
drop policy if exists community_members_join on public.community_group_members;
create policy community_members_join on public.community_group_members
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_members_leave on public.community_group_members;
create policy community_members_leave on public.community_group_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_group_staff(group_id));

-- Publicações
drop policy if exists community_posts_read on public.community_group_posts;
create policy community_posts_read on public.community_group_posts
  for select to authenticated using (
    moderation = 'aprovado' or user_id = auth.uid() or public.is_group_staff(group_id)
  );
drop policy if exists community_posts_insert on public.community_group_posts;
create policy community_posts_insert on public.community_group_posts
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id));
drop policy if exists community_posts_write on public.community_group_posts;
create policy community_posts_write on public.community_group_posts
  for update to authenticated
  using (user_id = auth.uid() or public.is_group_staff(group_id))
  with check (user_id = auth.uid() or public.is_group_staff(group_id));
drop policy if exists community_posts_delete on public.community_group_posts;
create policy community_posts_delete on public.community_group_posts
  for delete to authenticated
  using (user_id = auth.uid() or public.is_group_staff(group_id));

-- Curtidas
drop policy if exists community_likes_read on public.community_post_likes;
create policy community_likes_read on public.community_post_likes
  for select to authenticated using (true);
drop policy if exists community_likes_write on public.community_post_likes;
create policy community_likes_write on public.community_post_likes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Comentários
drop policy if exists community_comments_read on public.community_comments;
create policy community_comments_read on public.community_comments
  for select to authenticated using (
    moderation = 'aprovado' or user_id = auth.uid() or public.is_app_admin()
  );
drop policy if exists community_comments_insert on public.community_comments;
create policy community_comments_insert on public.community_comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_comments_update on public.community_comments;
create policy community_comments_update on public.community_comments
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists community_comments_delete on public.community_comments;
create policy community_comments_delete on public.community_comments
  for delete to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

-- Denúncias
drop policy if exists community_reports_insert on public.community_reports;
create policy community_reports_insert on public.community_reports
  for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists community_reports_admin on public.community_reports;
create policy community_reports_admin on public.community_reports
  for select to authenticated using (public.is_app_admin());
drop policy if exists community_reports_resolve on public.community_reports;
create policy community_reports_resolve on public.community_reports
  for update to authenticated using (public.is_app_admin());

-- Fila de resumos
drop policy if exists community_submissions_own on public.community_library_submissions;
create policy community_submissions_own on public.community_library_submissions
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists community_submissions_insert on public.community_library_submissions;
create policy community_submissions_insert on public.community_library_submissions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_submissions_admin on public.community_library_submissions;
create policy community_submissions_admin on public.community_library_submissions
  for update to authenticated using (public.is_app_admin());

-- Notificações
drop policy if exists community_notifications_own on public.community_notifications;
create policy community_notifications_own on public.community_notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists community_notifications_read on public.community_notifications;
create policy community_notifications_read on public.community_notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- SEED — grupos oficiais (spec §2)
-- ============================================================================
insert into public.community_groups (slug, name, description, category, official)
values
  ('enem-2026', 'ENEM 2026', 'Preparação geral para o ENEM 2026: cronograma, dúvidas e materiais.', 'ENEM', true),
  ('matematica', 'Matemática', 'Funções, geometria, estatística e resolução de questões.', 'Matéria', true),
  ('fisica', 'Física', 'Mecânica, eletricidade, ondas e termologia.', 'Matéria', true),
  ('quimica', 'Química', 'Química geral, orgânica, físico-química e ambiental.', 'Matéria', true),
  ('biologia', 'Biologia', 'Ecologia, genética, fisiologia e evolução.', 'Matéria', true),
  ('historia', 'História', 'Brasil e mundo contemporâneo com foco em vestibular.', 'Matéria', true),
  ('geografia', 'Geografia', 'Geografia física e humana, atualidades e geopolítica.', 'Matéria', true),
  ('redacao', 'Redação', 'Treino de redação, repertório e correção entre colegas.', 'Matéria', true),
  ('medicina', 'Medicina', 'Foco em vestibulares de medicina e provas específicas.', 'Curso', true),
  ('direito', 'Direito', 'Preparação para vestibulares e discussão de atualidades.', 'Curso', true),
  ('engenharia', 'Engenharia', 'Matemática e física aplicadas, provas específicas.', 'Curso', true),
  ('militares', 'Vestibulares Militares', 'AFA, EsPCEx, EFOMM, IME, ITA e afins.', 'Concursos', true),
  ('concursos', 'Concursos', 'Preparação para concursos públicos de nível médio e superior.', 'Concursos', true)
on conflict (slug) do nothing;
