-- ============================================================================
-- COGNI IA — Fase 10: Infraestrutura, Performance, Armazenamento e Monitoramento
-- Módulo independente. Reaproveita `is_app_admin()` (Fase 7).
-- Rodar no SQL Editor DEPOIS de 0001–0008.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('queued', 'running', 'done', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'log_level') then
    create type public.log_level as enum ('debug', 'info', 'warn', 'error');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- FILAS DE PROCESSAMENTO (spec §2)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,
  status        public.job_status not null default 'queued',
  payload       jsonb not null default '{}'::jsonb,
  result        jsonb,
  progress      int not null default 0,
  attempts      int not null default 0,
  max_attempts  int not null default 3,
  error         text,
  user_id       uuid references public.users (id) on delete set null,
  run_after     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
create index if not exists jobs_pending_idx
  on public.jobs (status, run_after) where status = 'queued';
create index if not exists jobs_user_idx on public.jobs (user_id, created_at desc);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- Reivindica até p_limit jobs prontos e marca como 'running' (atômico).
create or replace function public.claim_jobs(p_limit int default 5)
returns setof public.jobs
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.jobs j set
    status = 'running', started_at = now(), attempts = j.attempts + 1, updated_at = now()
  where j.id in (
    select id from public.jobs
    where status = 'queued' and run_after <= now()
    order by run_after
    limit p_limit
    for update skip locked
  )
  returning j.*;
end;
$$;

create or replace function public.finish_job(
  p_id uuid, p_status public.job_status, p_result jsonb default null, p_error text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempts int; v_max int;
begin
  select attempts, max_attempts into v_attempts, v_max from public.jobs where id = p_id;
  if p_status = 'error' and v_attempts < v_max then
    -- reprograma com backoff exponencial
    update public.jobs set status = 'queued', error = p_error,
      run_after = now() + (power(2, v_attempts) || ' minutes')::interval, updated_at = now()
     where id = p_id;
  else
    update public.jobs set status = p_status, result = p_result, error = p_error,
      finished_at = now(), progress = case when p_status = 'done' then 100 else progress end,
      updated_at = now()
     where id = p_id;
  end if;
end;
$$;

create or replace function public.set_job_progress(p_id uuid, p_progress int)
returns void language sql security definer set search_path = '' as $$
  update public.jobs set progress = greatest(0, least(100, p_progress)), updated_at = now()
  where id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- LOGS ESTRUTURADOS (spec §7)
-- ---------------------------------------------------------------------------
create table if not exists public.system_logs (
  id          bigint generated always as identity primary key,
  level       public.log_level not null default 'info',
  source      text not null,
  message     text not null,
  user_id     uuid references public.users (id) on delete set null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists system_logs_idx on public.system_logs (created_at desc);
create index if not exists system_logs_level_idx on public.system_logs (level, created_at desc);

create or replace function public.log_system_event(
  p_level public.log_level, p_source text, p_message text,
  p_user uuid default null, p_meta jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = '' as $$
  insert into public.system_logs (level, source, message, user_id, meta)
  values (p_level, left(p_source, 80), left(p_message, 2000), p_user, coalesce(p_meta, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- CONSUMO DE IA (spec §13, §14)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_calls (
  id           bigint generated always as identity primary key,
  provider     text not null,
  model        text,
  kind         text not null,
  user_id      uuid references public.users (id) on delete set null,
  tokens_in    int,
  tokens_out   int,
  duration_ms  int,
  cost_usd     numeric,
  ok           boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists ai_calls_idx on public.ai_calls (created_at desc);
create index if not exists ai_calls_provider_idx on public.ai_calls (provider, created_at desc);

create or replace function public.record_ai_call(
  p_provider text, p_model text, p_kind text, p_user uuid,
  p_tokens_in int default null, p_tokens_out int default null,
  p_duration_ms int default null, p_cost_usd numeric default null, p_ok boolean default true
)
returns void language sql security definer set search_path = '' as $$
  insert into public.ai_calls (provider, model, kind, user_id, tokens_in, tokens_out, duration_ms, cost_usd, ok)
  values (p_provider, p_model, p_kind, p_user, p_tokens_in, p_tokens_out, p_duration_ms, p_cost_usd, p_ok);
$$;

-- ---------------------------------------------------------------------------
-- METADADOS DE ARQUIVOS (spec §3, §18)
-- ---------------------------------------------------------------------------
create table if not exists public.storage_objects (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null,
  path        text not null unique,
  owner_id    uuid references public.users (id) on delete cascade,
  kind        text,
  size_bytes  int,
  mime        text,
  created_at  timestamptz not null default now()
);
create index if not exists storage_objects_owner_idx on public.storage_objects (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- CRON HELPERS (spec §8, §9)
-- ---------------------------------------------------------------------------
create or replace function public.publish_scheduled_posts()
returns int language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  update public.blog_posts set status = 'publicado', published_at = coalesce(published_at, now()), updated_at = now()
   where status = 'agendado' and scheduled_for is not null and scheduled_for <= now();
  get diagnostics v = row_count;
  return v;
end;
$$;

create or replace function public.purge_old_telemetry(p_days int default 90)
returns void language sql security definer set search_path = '' as $$
  delete from public.page_views where created_at < now() - (p_days || ' days')::interval;
  delete from public.system_logs where created_at < now() - (p_days || ' days')::interval and level <> 'error';
  delete from public.ai_calls where created_at < now() - (p_days || ' days')::interval;
  delete from public.jobs where status in ('done','error') and finished_at < now() - interval '7 days';
$$;

-- ============================================================================
-- ÍNDICES ADICIONAIS para consultas frequentes (spec §10)
-- ============================================================================
create index if not exists payments_created_idx on public.payments (created_at desc);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists billing_events_type_idx on public.billing_events (type, created_at desc);
create index if not exists activity_log_kind_time_idx on public.activity_log (kind, created_at desc);
create index if not exists essay_submissions_status_time_idx on public.essay_submissions (status, created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.jobs             enable row level security;
alter table public.system_logs      enable row level security;
alter table public.ai_calls         enable row level security;
alter table public.storage_objects  enable row level security;

drop policy if exists jobs_read on public.jobs;
create policy jobs_read on public.jobs
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists system_logs_admin on public.system_logs;
create policy system_logs_admin on public.system_logs
  for select to authenticated using (public.is_app_admin());

drop policy if exists ai_calls_admin on public.ai_calls;
create policy ai_calls_admin on public.ai_calls
  for select to authenticated using (public.is_app_admin());

drop policy if exists storage_objects_own on public.storage_objects;
create policy storage_objects_own on public.storage_objects
  for select to authenticated
  using (owner_id = auth.uid() or public.is_app_admin());
drop policy if exists storage_objects_insert on public.storage_objects;
create policy storage_objects_insert on public.storage_objects
  for insert to authenticated with check (owner_id = auth.uid());
