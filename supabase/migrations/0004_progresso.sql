-- ============================================================================
-- COGNI IA — Fase 5: Progresso, Favoritos e Analytics de Aprendizado
-- Módulo independente. Reaproveita `progress`, `favorites` (Fase 2),
-- `library_reading_history` (Fase 3) e `chat_*` (Fase 4) sem alterá-las.
-- Adiciona: activity_log (histórico unificado), study_sessions / study_daily
-- (tempo de estudo) e content_difficulty (dificuldade percebida).
--
-- Rodar no SQL Editor DEPOIS de 0001–0003.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_kind') then
    create type public.activity_kind as enum (
      'content_read', 'content_completed', 'chat', 'questions', 'essay'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'difficulty_level') then
    create type public.difficulty_level as enum ('facil', 'medio', 'dificil');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- HISTÓRICO UNIFICADO DE ATIVIDADES (spec §3)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  kind          public.activity_kind not null,
  subject_slug  text,
  ref_id        text,
  ref_label     text,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists activity_log_user_time_idx
  on public.activity_log (user_id, created_at desc);
create index if not exists activity_log_user_subject_idx
  on public.activity_log (user_id, subject_slug);
create index if not exists activity_log_user_kind_idx
  on public.activity_log (user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- SESSÕES E TEMPO DE ESTUDO (spec §1, §10)
-- ---------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz not null default now()
);
create index if not exists study_sessions_user_idx
  on public.study_sessions (user_id, ended_at desc);

create table if not exists public.study_daily (
  user_id       uuid not null references public.users (id) on delete cascade,
  day           date not null default current_date,
  minutes       int not null default 0,
  activities    int not null default 0,
  last_ping_at  timestamptz,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- DIFICULDADE PERCEBIDA POR CONTEÚDO (spec §1 "nível de dificuldade percebido")
-- ---------------------------------------------------------------------------
create table if not exists public.content_difficulty (
  user_id     uuid not null references public.users (id) on delete cascade,
  content_id  uuid not null references public.library_contents (id) on delete cascade,
  level       public.difficulty_level not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, content_id)
);

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

-- Registra uma atividade no histórico + conta no rollup diário.
create or replace function public.log_activity(
  p_user uuid,
  p_kind public.activity_kind,
  p_subject text default null,
  p_ref_id text default null,
  p_ref_label text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_log (user_id, kind, subject_slug, ref_id, ref_label, meta)
  values (p_user, p_kind, p_subject, p_ref_id, p_ref_label, coalesce(p_meta, '{}'::jsonb));

  insert into public.study_daily (user_id, day, activities)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update
    set activities = public.study_daily.activities + 1;
end;
$$;

-- Heartbeat: soma o tempo real de presença (com deduplicação simples) e
-- mantém uma sessão aberta.
create or replace function public.study_ping(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last timestamptz;
  v_delta numeric;
  v_sid uuid;
begin
  select last_ping_at into v_last
    from public.study_daily
   where user_id = p_user and day = current_date;

  v_delta := least(
    extract(epoch from (now() - coalesce(v_last, now() - interval '1 minute'))) / 60.0,
    2.0
  );
  if v_delta < 0 then v_delta := 0; end if;

  insert into public.study_daily (user_id, day, minutes, last_ping_at)
  values (p_user, current_date, round(v_delta), now())
  on conflict (user_id, day) do update
    set minutes = least(public.study_daily.minutes + round(v_delta), 900),
        last_ping_at = now();

  select id into v_sid
    from public.study_sessions
   where user_id = p_user and ended_at > now() - interval '10 minutes'
   order by ended_at desc limit 1;

  if v_sid is null then
    insert into public.study_sessions (user_id) values (p_user);
  else
    update public.study_sessions set ended_at = now() where id = v_sid;
  end if;
end;
$$;

-- ============================================================================
-- RLS — tudo por usuário; escrita nos rollups só via as funções acima.
-- ============================================================================
alter table public.activity_log        enable row level security;
alter table public.study_sessions      enable row level security;
alter table public.study_daily         enable row level security;
alter table public.content_difficulty  enable row level security;

drop policy if exists activity_log_read_own on public.activity_log;
create policy activity_log_read_own on public.activity_log
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists study_sessions_read_own on public.study_sessions;
create policy study_sessions_read_own on public.study_sessions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists study_daily_read_own on public.study_daily;
create policy study_daily_read_own on public.study_daily
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists content_difficulty_all_own on public.content_difficulty;
create policy content_difficulty_all_own on public.content_difficulty
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
