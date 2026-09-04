-- ============================================================================
-- COGNI IA — Fase 11: Segurança, Privacidade e LGPD
-- Módulo independente. Reaproveita set_updated_at() (0001) e is_app_admin() (0006).
-- Rodar no SQL Editor DEPOIS de 0001–0009.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Estado de segurança por usuário (MFA, validade de sessões, exclusão)
-- ---------------------------------------------------------------------------
create table if not exists public.user_security (
  user_id                uuid primary key references public.users (id) on delete cascade,
  mfa_enabled            boolean not null default false,
  -- Qualquer access token emitido ANTES deste instante é considerado inválido
  -- pela aplicação (logout global / "sair de todos os dispositivos").
  sessions_valid_after   timestamptz not null default now(),
  deletion_requested_at  timestamptz,
  deletion_scheduled_for timestamptz,
  updated_at             timestamptz not null default now()
);

drop trigger if exists user_security_set_updated_at on public.user_security;
create trigger user_security_set_updated_at
  before update on public.user_security
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Sessões/dispositivos conhecidos (a fonte da verdade é o GoTrue; aqui
--    guardamos metadados para exibir e revogar seletivamente)
-- ---------------------------------------------------------------------------
create table if not exists public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  token_iat     bigint,                 -- claim `iat` do access token (epoch s)
  user_agent    text,
  ip_hash       text,                   -- HMAC-SHA256 do IP (nunca o IP puro)
  device_label  text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz
);
create index if not exists user_sessions_user_idx
  on public.user_sessions (user_id, last_seen_at desc);

-- ---------------------------------------------------------------------------
-- 3. Consentimento (LGPD art. 8º) — cookies/analytics/marketing + versões
-- ---------------------------------------------------------------------------
create table if not exists public.user_consent (
  user_id         uuid primary key references public.users (id) on delete cascade,
  analytics       boolean not null default false,
  marketing       boolean not null default false,
  terms_version   text,
  policy_version  text,
  updated_at      timestamptz not null default now()
);

drop trigger if exists user_consent_set_updated_at on public.user_consent;
create trigger user_consent_set_updated_at
  before update on public.user_consent
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Trilha de auditoria de segurança (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.users (id) on delete set null,
  email       text,
  event       text not null,            -- login, logout, login_failed, password_changed,
                                        -- mfa_enabled, mfa_disabled, session_revoked,
                                        -- data_export_requested, account_deletion_requested,
                                        -- account_deletion_cancelled, consent_updated, rate_limited
  ip_hash     text,
  user_agent  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_user_idx on public.security_events (user_id, created_at desc);
create index if not exists security_events_type_idx on public.security_events (event, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Exportação de dados (LGPD art. 18, II/V) — processada pela fila (Fase 10)
-- ---------------------------------------------------------------------------
create table if not exists public.data_exports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'processing', 'ready', 'error', 'expired')),
  storage_path  text,
  size_bytes    int,
  error         text,
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz,
  expires_at    timestamptz
);
create index if not exists data_exports_user_idx on public.data_exports (user_id, requested_at desc);

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

-- Cria a linha de segurança do usuário se ainda não existe.
create or replace function public.ensure_user_security(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.user_security (user_id) values (p_user)
  on conflict (user_id) do nothing;
$$;

create or replace function public.log_security_event(
  p_event text,
  p_user uuid default null,
  p_email text default null,
  p_ip_hash text default null,
  p_ua text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = '' as $$
  insert into public.security_events (user_id, email, event, ip_hash, user_agent, meta)
  values (p_user, left(p_email, 160), left(p_event, 60), p_ip_hash, left(p_ua, 400), coalesce(p_meta, '{}'::jsonb));
$$;

-- Logout global: invalida todos os tokens já emitidos e marca as sessões.
create or replace function public.revoke_all_sessions(p_user uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  v_user := coalesce(p_user, auth.uid());
  if v_user is null then return; end if;
  if v_user <> auth.uid() and not public.is_app_admin() then
    raise exception 'not allowed';
  end if;

  insert into public.user_security (user_id, sessions_valid_after)
  values (v_user, now())
  on conflict (user_id) do update set sessions_valid_after = now(), updated_at = now();

  update public.user_sessions set revoked_at = now()
   where user_id = v_user and revoked_at is null;
end;
$$;

create or replace function public.revoke_session(p_session uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.user_sessions set revoked_at = now()
   where id = p_session
     and (user_id = auth.uid() or public.is_app_admin())
     and revoked_at is null;
end;
$$;

create or replace function public.request_account_deletion(p_grace_days int default 30)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare v_when timestamptz;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  v_when := now() + (greatest(1, p_grace_days) || ' days')::interval;
  insert into public.user_security (user_id, deletion_requested_at, deletion_scheduled_for)
  values (auth.uid(), now(), v_when)
  on conflict (user_id) do update
    set deletion_requested_at = now(), deletion_scheduled_for = v_when, updated_at = now();
  return v_when;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  update public.user_security
     set deletion_requested_at = null, deletion_scheduled_for = null, updated_at = now()
   where user_id = auth.uid();
end;
$$;

-- CRON: apaga contas cuja carência venceu. Remove de public.users (cascata
-- limpa todas as tabelas do app) e de auth.users (remove o login).
create or replace function public.purge_due_deletions()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select user_id from public.user_security
     where deletion_scheduled_for is not null and deletion_scheduled_for <= now()
  loop
    delete from public.users where id = r.user_id;
    delete from auth.users where id = r.user_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- CRON: expira exportações antigas (o arquivo é removido pela aplicação).
create or replace function public.expire_due_exports()
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.data_exports
     set status = 'expired', storage_path = null
   where status = 'ready' and expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.set_user_consent(
  p_analytics boolean, p_marketing boolean,
  p_terms text default null, p_policy text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  insert into public.user_consent (user_id, analytics, marketing, terms_version, policy_version)
  values (auth.uid(), coalesce(p_analytics, false), coalesce(p_marketing, false), p_terms, p_policy)
  on conflict (user_id) do update set
    analytics = coalesce(p_analytics, false),
    marketing = coalesce(p_marketing, false),
    terms_version = coalesce(p_terms, public.user_consent.terms_version),
    policy_version = coalesce(p_policy, public.user_consent.policy_version),
    updated_at = now();
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.user_security   enable row level security;
alter table public.user_sessions   enable row level security;
alter table public.user_consent    enable row level security;
alter table public.security_events enable row level security;
alter table public.data_exports    enable row level security;

drop policy if exists user_security_own on public.user_security;
create policy user_security_own on public.user_security
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists user_sessions_own on public.user_sessions;
create policy user_sessions_own on public.user_sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists user_consent_select on public.user_consent;
create policy user_consent_select on public.user_consent
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists user_consent_write on public.user_consent;
create policy user_consent_write on public.user_consent
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists user_consent_update on public.user_consent;
create policy user_consent_update on public.user_consent
  for update to authenticated using (user_id = auth.uid());

drop policy if exists security_events_own on public.security_events;
create policy security_events_own on public.security_events
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists data_exports_own on public.data_exports;
create policy data_exports_own on public.data_exports
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists data_exports_insert on public.data_exports;
create policy data_exports_insert on public.data_exports
  for insert to authenticated with check (user_id = auth.uid());
