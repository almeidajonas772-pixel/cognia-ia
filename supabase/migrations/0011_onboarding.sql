-- ============================================================================
-- COGNI IA — Fase 13: Onboarding e lançamento
-- Módulo independente. Reaproveita set_updated_at() (0001).
-- Rodar no SQL Editor DEPOIS de 0001–0010.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Estado de onboarding por usuário (primeiros passos guiados)
-- ---------------------------------------------------------------------------
create table if not exists public.user_onboarding (
  user_id        uuid primary key references public.users (id) on delete cascade,
  completed      boolean not null default false,
  goal           text,                 -- 'enem' | 'vestibular' | 'reforco' | 'outro'
  exam_date      date,
  target_course  text,
  focus_areas    text[] not null default '{}',
  level          text,                 -- 'basico' | 'intermediario' | 'avancado'
  steps_done     text[] not null default '{}',
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  updated_at     timestamptz not null default now()
);

drop trigger if exists user_onboarding_set_updated_at on public.user_onboarding;
create trigger user_onboarding_set_updated_at
  before update on public.user_onboarding
  for each row execute function public.set_updated_at();

-- Marca o onboarding como concluído para o usuário atual.
create or replace function public.complete_onboarding()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  insert into public.user_onboarding (user_id, completed, completed_at)
  values (auth.uid(), true, now())
  on conflict (user_id) do update
    set completed = true, completed_at = coalesce(public.user_onboarding.completed_at, now()),
        updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.user_onboarding enable row level security;

drop policy if exists user_onboarding_select on public.user_onboarding;
create policy user_onboarding_select on public.user_onboarding
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists user_onboarding_insert on public.user_onboarding;
create policy user_onboarding_insert on public.user_onboarding
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists user_onboarding_update on public.user_onboarding;
create policy user_onboarding_update on public.user_onboarding
  for update to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Lista de espera (usada quando o lançamento está em modo 'waitlist')
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  meta        jsonb not null default '{}'::jsonb,
  invited_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- Escrita só via service role (rota /api/waitlist). Leitura só admin.
drop policy if exists waitlist_admin_read on public.waitlist;
create policy waitlist_admin_read on public.waitlist
  for select to authenticated using (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- Estado de lançamento (editável pelo admin em site_config)
--   mode:        'live' | 'waitlist' | 'maintenance'
--   banner:      texto do aviso no topo (ou null)
--   signup_open: permite cadastro quando true
-- ---------------------------------------------------------------------------
insert into public.site_config (key, value)
values ('launch', '{"mode":"live","banner":null,"signup_open":true}'::jsonb)
on conflict (key) do nothing;
