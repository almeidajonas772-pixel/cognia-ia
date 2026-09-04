-- ============================================================================
-- COGNI IA — Fase 2: Autenticação + Banco de Dados
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute (Run).
-- Ele é idempotente o suficiente para rodar uma vez em um projeto novo.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type public.plan_tier as enum ('free', 'premium');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper: manter updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- USERS  (perfil da aplicação — 1:1 com auth.users)
--   spec: id, email, plan, created_at
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  plan        public.plan_tier not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Cria a linha em public.users automaticamente quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- PROGRESS
--   spec: user_id, subject, topic, completed
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  subject       text not null,
  topic         text not null,
  completed     boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, subject, topic)
);
create index if not exists progress_user_idx on public.progress (user_id);

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- FAVORITES
--   spec: user_id, item_type, item_id
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  item_type   text not null,   -- 'content' | 'chat_message' | 'essay' | 'post' | 'question'
  item_id     text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists favorites_user_idx on public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- CHAT_HISTORY
--   spec: user_id, prompt, response, created_at
-- ---------------------------------------------------------------------------
create table if not exists public.chat_history (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  conversation_id  uuid not null default gen_random_uuid(),
  prompt           text not null,
  response         text not null,
  created_at       timestamptz not null default now()
);
create index if not exists chat_history_user_idx on public.chat_history (user_id, created_at desc);
create index if not exists chat_history_conversation_idx on public.chat_history (conversation_id);

-- ---------------------------------------------------------------------------
-- ESSAYS
--   spec: user_id, text, correction, grade
-- ---------------------------------------------------------------------------
create table if not exists public.essays (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  text         text not null,
  correction   jsonb,
  grade        numeric(6, 2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists essays_user_idx on public.essays (user_id, created_at desc);

drop trigger if exists essays_set_updated_at on public.essays;
create trigger essays_set_updated_at
  before update on public.essays
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- COMMUNITY_POSTS
--   spec: user_id, content, created_at
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  content      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Regra geral: cada usuário só enxerga e altera os próprios dados.
-- Exceção: community_posts é legível por qualquer usuário autenticado.
-- ============================================================================

alter table public.users            enable row level security;
alter table public.progress         enable row level security;
alter table public.favorites        enable row level security;
alter table public.chat_history     enable row level security;
alter table public.essays           enable row level security;
alter table public.community_posts  enable row level security;

-- USERS -------------------------------------------------------------------
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- PROGRESS --------------------------------------------------------------
drop policy if exists progress_all_own on public.progress;
create policy progress_all_own on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FAVORITES -----------------------------------------------------------
drop policy if exists favorites_all_own on public.favorites;
create policy favorites_all_own on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHAT_HISTORY ------------------------------------------------------
drop policy if exists chat_history_all_own on public.chat_history;
create policy chat_history_all_own on public.chat_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ESSAYS -------------------------------------------------------------
drop policy if exists essays_all_own on public.essays;
create policy essays_all_own on public.essays
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COMMUNITY_POSTS -------------------------------------------------
drop policy if exists community_posts_select_all on public.community_posts;
create policy community_posts_select_all on public.community_posts
  for select to authenticated using (true);

drop policy if exists community_posts_write_own on public.community_posts;
create policy community_posts_write_own on public.community_posts
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
