-- ============================================================================
-- COGNI IA — Fase 15: IA adaptativa, memória evolutiva e roteamento de modelo
-- Estende chat_user_memory (Fase 4) de forma ADITIVA. Reaproveita
-- set_updated_at() (0001) e is_app_admin() (0006).
-- Rodar no SQL Editor DEPOIS de 0001–0012.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Memória evolutiva — novas colunas em chat_user_memory
-- ---------------------------------------------------------------------------
alter table public.chat_user_memory
  add column if not exists evolved_summary text,
  add column if not exists strengths text[] not null default '{}',
  add column if not exists weaknesses text[] not null default '{}',
  add column if not exists memory_version int not null default 0,
  add column if not exists interactions_since_evolve int not null default 0,
  add column if not exists last_evolved_at timestamptz;

-- Histórico de versões da memória (auditoria / rollback)
create table if not exists public.memory_snapshots (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.users (id) on delete cascade,
  version     int not null,
  payload     jsonb not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists memory_snapshots_user on public.memory_snapshots (user_id, version desc);

-- ---------------------------------------------------------------------------
-- 2. Funções
-- ---------------------------------------------------------------------------

-- Conta interações desde a última evolução; retorna o novo total.
create or replace function public.bump_memory_interactions(p_user uuid, p_delta int default 1)
returns int language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  insert into public.chat_user_memory (user_id, interactions_since_evolve)
  values (p_user, greatest(0, p_delta))
  on conflict (user_id) do update
    set interactions_since_evolve = public.chat_user_memory.interactions_since_evolve + p_delta,
        updated_at = now()
  returning interactions_since_evolve into v;
  return coalesce(v, 0);
end;
$$;

-- Aplica uma nova versão da memória (chamada pelo job de evolução).
create or replace function public.apply_memory_evolution(
  p_user uuid,
  p_summary text,
  p_strengths text[],
  p_weaknesses text[],
  p_style text,
  p_payload jsonb
)
returns int language plpgsql security definer set search_path = '' as $$
declare v_version int;
begin
  insert into public.chat_user_memory (user_id) values (p_user)
  on conflict (user_id) do nothing;

  update public.chat_user_memory set
    evolved_summary = nullif(left(coalesce(p_summary, ''), 2000), ''),
    strengths = coalesce(p_strengths, '{}'::text[]),
    weaknesses = coalesce(p_weaknesses, '{}'::text[]),
    learning_style = coalesce(nullif(p_style, ''), learning_style),
    memory_version = memory_version + 1,
    interactions_since_evolve = 0,
    last_evolved_at = now(),
    updated_at = now()
  where user_id = p_user
  returning memory_version into v_version;

  insert into public.memory_snapshots (user_id, version, payload, reason)
  values (p_user, coalesce(v_version, 1), coalesce(p_payload, '{}'::jsonb), 'evolve');

  return coalesce(v_version, 1);
end;
$$;

-- CRON: enfileira a evolução de memória de perfis "vencidos" (>=7 dias e com
-- interações acumuladas), sem duplicar jobs em aberto.
create or replace function public.enqueue_due_memory_evolutions()
returns int language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  insert into public.jobs (type, payload, user_id, max_attempts)
  select 'memory_evolution',
         jsonb_build_object('userId', m.user_id::text, 'dedupeKey', 'mem:' || m.user_id::text),
         m.user_id, 2
    from public.chat_user_memory m
   where m.interactions_since_evolve >= 5
     and (m.last_evolved_at is null or m.last_evolved_at < now() - interval '7 days')
     and not exists (
       select 1 from public.jobs j
        where j.type = 'memory_evolution'
          and j.status in ('queued', 'running')
          and j.payload->>'userId' = m.user_id::text
     )
   limit 200;
  get diagnostics v = row_count;
  return v;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Config de roteamento de modelo (editável pelo admin)
--    Formato: { "<task>": [ { "provider":"openai", "model":"...", "minComplexity":0 } ] }
-- ---------------------------------------------------------------------------
insert into public.site_config (key, value)
values ('model_routing', '{}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.memory_snapshots enable row level security;

drop policy if exists memory_snapshots_read on public.memory_snapshots;
create policy memory_snapshots_read on public.memory_snapshots
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
