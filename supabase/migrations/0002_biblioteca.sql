-- ============================================================================
-- COGNI IA — Fase 3: Biblioteca ENEM
-- Módulo independente. NÃO altera nada das Fases 1 e 2.
-- Progresso e favoritos reaproveitam as tabelas `progress` e `favorites` da
-- Fase 2 (sem alterá-las). Este arquivo só ADICIONA tabelas `library_*`.
--
-- Rode no SQL Editor do Supabase DEPOIS do 0001_init.sql.
-- Depois rode o seed:  npm run seed:biblioteca
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'library_area') then
    create type public.library_area as enum (
      'linguagens', 'matematica', 'natureza', 'humanas', 'redacao'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'library_recurrence') then
    -- 🔴 muito_recorrente  🟠 recorrente  🟡 ocasional  🟢 raro
    create type public.library_recurrence as enum (
      'muito_recorrente', 'recorrente', 'ocasional', 'raro'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- MATÉRIA
-- ---------------------------------------------------------------------------
create table if not exists public.library_subjects (
  id           uuid primary key default gen_random_uuid(),
  area         public.library_area not null,
  slug         text not null unique,
  name         text not null,
  description  text,
  icon         text,                       -- nome do ícone lucide-react
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists library_subjects_set_updated_at on public.library_subjects;
create trigger library_subjects_set_updated_at
  before update on public.library_subjects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TEMA
-- ---------------------------------------------------------------------------
create table if not exists public.library_topics (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.library_subjects (id) on delete cascade,
  slug         text not null,
  name         text not null,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (subject_id, slug)
);
create index if not exists library_topics_subject_idx on public.library_topics (subject_id);

-- ---------------------------------------------------------------------------
-- CONTEÚDO
--   summary_short  -> RESUMO RÁPIDO (grátis): só os tópicos principais
--   corpo completo -> tabela library_content_premium (assinantes)
-- ---------------------------------------------------------------------------
create table if not exists public.library_contents (
  id               uuid primary key default gen_random_uuid(),
  topic_id         uuid not null references public.library_topics (id) on delete cascade,
  subject_id       uuid not null references public.library_subjects (id) on delete cascade,
  slug             text not null,
  title            text not null,
  summary_short    text not null,
  recurrence       public.library_recurrence not null default 'ocasional',
  reading_minutes  int not null default 8,
  is_published     boolean not null default true,
  position         int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (subject_id, slug)          -- rota: /biblioteca/[subject]/[content]
);
create index if not exists library_contents_topic_idx on public.library_contents (topic_id);
create index if not exists library_contents_subject_idx on public.library_contents (subject_id);
create index if not exists library_contents_recurrence_idx on public.library_contents (recurrence);

drop trigger if exists library_contents_set_updated_at on public.library_contents;
create trigger library_contents_set_updated_at
  before update on public.library_contents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RESUMO COMPLETO (Premium)
-- ---------------------------------------------------------------------------
create table if not exists public.library_content_premium (
  content_id  uuid primary key references public.library_contents (id) on delete cascade,
  body        text not null,           -- markdown, no padrão dos guias do usuário
  updated_at  timestamptz not null default now()
);

drop trigger if exists library_content_premium_set_updated_at on public.library_content_premium;
create trigger library_content_premium_set_updated_at
  before update on public.library_content_premium
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- HISTÓRICO DE LEITURA / "continuar de onde parou"
-- (progresso e favoritos ficam nas tabelas da Fase 2)
-- ---------------------------------------------------------------------------
create table if not exists public.library_reading_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  content_id      uuid not null references public.library_contents (id) on delete cascade,
  last_viewed_at  timestamptz not null default now(),
  view_count      int not null default 1,
  unique (user_id, content_id)
);
create index if not exists library_reading_history_user_idx
  on public.library_reading_history (user_id, last_viewed_at desc);

-- ============================================================================
-- Helper: usuário logado é Premium?
-- ============================================================================
create or replace function public.is_premium()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and plan = 'premium'
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.library_subjects         enable row level security;
alter table public.library_topics           enable row level security;
alter table public.library_contents         enable row level security;
alter table public.library_content_premium  enable row level security;
alter table public.library_reading_history  enable row level security;

-- Catálogo: leitura liberada (inclusive visitante) — habilita SEO na Fase 9.
drop policy if exists library_subjects_read on public.library_subjects;
create policy library_subjects_read on public.library_subjects
  for select using (true);

drop policy if exists library_topics_read on public.library_topics;
create policy library_topics_read on public.library_topics
  for select using (true);

drop policy if exists library_contents_read on public.library_contents;
create policy library_contents_read on public.library_contents
  for select using (is_published);

-- Resumo completo: só assinante Premium.
drop policy if exists library_premium_read on public.library_content_premium;
create policy library_premium_read on public.library_content_premium
  for select to authenticated using (public.is_premium());

-- Histórico de leitura: cada um o seu.
drop policy if exists library_history_all_own on public.library_reading_history;
create policy library_history_all_own on public.library_reading_history
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Escrita no catálogo (subjects/topics/contents/premium) fica só para o
-- service_role (seed + painel admin da Fase 9), que ignora RLS.
