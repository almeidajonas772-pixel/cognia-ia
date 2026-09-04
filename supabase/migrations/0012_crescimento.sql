-- ============================================================================
-- COGNI IA — Fase 14: Crescimento, Retenção e Indicação
-- Gamificação (XP / nível / streak / conquistas) + programa de indicação.
-- Reaproveita set_updated_at() (0001) e is_app_admin() (0006).
-- Rodar no SQL Editor DEPOIS de 0001–0011.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'referral_status') then
    create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'void');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Estado de gamificação por usuário
-- ---------------------------------------------------------------------------
create table if not exists public.user_gamification (
  user_id            uuid primary key references public.users (id) on delete cascade,
  xp                 int not null default 0,
  level              int not null default 1,
  current_streak     int not null default 0,
  longest_streak     int not null default 0,
  last_active_date   date,
  streak_freezes     int not null default 0,
  weekly_goal_minutes int not null default 150,
  last_nudge_date    date,
  updated_at         timestamptz not null default now()
);

drop trigger if exists user_gamification_set_updated_at on public.user_gamification;
create trigger user_gamification_set_updated_at
  before update on public.user_gamification
  for each row execute function public.set_updated_at();

-- Ledger de XP (idempotente por (user_id, kind, dedupe_key))
create table if not exists public.xp_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.users (id) on delete cascade,
  kind        text not null,
  amount      int not null,
  dedupe_key  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create unique index if not exists xp_events_dedupe
  on public.xp_events (user_id, kind, dedupe_key) where dedupe_key is not null;
create index if not exists xp_events_user_time on public.xp_events (user_id, created_at desc);
create index if not exists xp_events_recent on public.xp_events (created_at desc);

-- Conquistas desbloqueadas (catálogo fica no código — lib/gamification/achievements.ts)
create table if not exists public.user_achievements (
  user_id        uuid not null references public.users (id) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  seen           boolean not null default false,
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- 2. Indicação (referral)
-- ---------------------------------------------------------------------------
create table if not exists public.referral_codes (
  user_id     uuid primary key references public.users (id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.referrals (
  id                     uuid primary key default gen_random_uuid(),
  referrer_id            uuid not null references public.users (id) on delete cascade,
  referred_id            uuid not null unique references public.users (id) on delete cascade,
  code                   text not null,
  status                 public.referral_status not null default 'pending',
  referrer_reward_xp     int not null default 0,
  referred_reward_xp     int not null default 0,
  created_at             timestamptz not null default now(),
  qualified_at           timestamptz,
  rewarded_at            timestamptz,
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer on public.referrals (referrer_id, created_at desc);

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

-- Nível a partir do XP: nível N exige 50 * N * (N-1) de XP acumulado
-- (nível 2 = 100, 3 = 300, 4 = 600, 5 = 1000, ...).
create or replace function public.level_for_xp(p_xp int)
returns int language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + (p_xp / 12.5))) / 2))::int;
$$;

create or replace function public.ensure_gamification(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.user_gamification (user_id) values (p_user)
  on conflict (user_id) do nothing;
$$;

-- Concede XP. `p_dedupe` != null torna a concessão única (ex.: 'daily:2026-09-03').
create or replace function public.grant_xp(
  p_user uuid, p_kind text, p_amount int,
  p_dedupe text default null, p_meta jsonb default '{}'::jsonb
)
returns int language plpgsql security definer set search_path = '' as $$
declare v_new_xp int; v_inserted boolean := false;
begin
  if p_user is null or p_amount is null or p_amount = 0 then return 0; end if;

  begin
    insert into public.xp_events (user_id, kind, amount, dedupe_key, meta)
    values (p_user, p_kind, p_amount, p_dedupe, coalesce(p_meta, '{}'::jsonb));
    v_inserted := true;
  exception when unique_violation then
    v_inserted := false;
  end;

  if not v_inserted then
    select xp into v_new_xp from public.user_gamification where user_id = p_user;
    return coalesce(v_new_xp, 0);
  end if;

  insert into public.user_gamification (user_id, xp, level)
  values (p_user, greatest(0, p_amount), public.level_for_xp(greatest(0, p_amount)))
  on conflict (user_id) do update
    set xp = greatest(0, public.user_gamification.xp + p_amount),
        level = public.level_for_xp(greatest(0, public.user_gamification.xp + p_amount)),
        updated_at = now()
  returning xp into v_new_xp;

  return v_new_xp;
end;
$$;

-- Atualiza o streak diário. Retorna o streak atual.
create or replace function public.touch_streak(p_user uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare v_last date; v_streak int; v_freezes int; v_gap int; v_new int;
begin
  perform public.ensure_gamification(p_user);
  select last_active_date, current_streak, streak_freezes
    into v_last, v_streak, v_freezes
  from public.user_gamification where user_id = p_user;

  if v_last = current_date then
    return v_streak;
  end if;

  v_gap := case when v_last is null then 999 else current_date - v_last end;

  if v_gap = 1 then
    v_new := coalesce(v_streak, 0) + 1;
  elsif v_gap = 2 and coalesce(v_freezes, 0) > 0 then
    v_new := coalesce(v_streak, 0) + 1;
    v_freezes := v_freezes - 1;
  else
    v_new := 1;
  end if;

  update public.user_gamification set
    current_streak = v_new,
    longest_streak = greatest(longest_streak, v_new),
    last_active_date = current_date,
    streak_freezes = coalesce(v_freezes, streak_freezes),
    updated_at = now()
  where user_id = p_user;

  return v_new;
end;
$$;

-- Código de indicação do usuário (cria se não existe).
create or replace function public.get_or_create_referral_code()
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  select code into v_code from public.referral_codes where user_id = auth.uid();
  if v_code is not null then return v_code; end if;

  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') for 7));
    begin
      insert into public.referral_codes (user_id, code) values (auth.uid(), v_code);
      return v_code;
    exception when unique_violation then
      -- colisão de código: tenta de novo
    end;
  end loop;
end;
$$;

-- Registra que o usuário atual foi indicado por `p_code` (chamado no onboarding).
create or replace function public.record_referral(p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_referrer uuid;
begin
  if auth.uid() is null or p_code is null then return false; end if;
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then
    return false;
  end if;
  select user_id into v_referrer from public.referral_codes
   where code = upper(trim(p_code));
  if v_referrer is null or v_referrer = auth.uid() then return false; end if;

  insert into public.referrals (referrer_id, referred_id, code)
  values (v_referrer, auth.uid(), upper(trim(p_code)))
  on conflict (referred_id) do nothing;
  return true;
end;
$$;

-- O usuário atual atingiu o marco de qualificação (ex.: concluiu o onboarding).
-- Marca a indicação como 'qualified' e concede as recompensas de XP a ambos.
create or replace function public.qualify_referral()
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  select * into r from public.referrals
   where referred_id = auth.uid() and status = 'pending'
   limit 1;
  if not found then return; end if;

  update public.referrals set
    status = 'rewarded',
    referrer_reward_xp = 300,
    referred_reward_xp = 150,
    qualified_at = now(),
    rewarded_at = now()
  where id = r.id;

  perform public.grant_xp(r.referrer_id, 'referral_referrer', 300,
    'ref:' || r.id::text, jsonb_build_object('referral', r.id));
  perform public.grant_xp(r.referred_id, 'referral_referred', 150,
    'ref:' || r.id::text, jsonb_build_object('referral', r.id));

  update public.user_gamification set streak_freezes = streak_freezes + 1
   where user_id in (r.referrer_id, r.referred_id);
end;
$$;

-- Notificação de sistema (sem pular o próprio usuário — usada pelo cron).
create or replace function public.notify_user(
  p_user uuid, p_kind text, p_title text, p_href text default null
)
returns void language sql security definer set search_path = '' as $$
  insert into public.community_notifications (user_id, kind, title, href)
  values (p_user, p_kind, left(p_title, 200), p_href);
$$;

-- CRON: nudges de inatividade + recap semanal (guardado por marcador).
create or replace function public.run_growth_maintenance()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_nudges int := 0; v_recaps int := 0; v_state jsonb; v_last_recap date; r record;
begin
  -- 1) Nudges: 3 e 7 dias inativo, no máx. 1 a cada 7 dias
  for r in
    select user_id, current_date - last_active_date as gap
      from public.user_gamification
     where last_active_date is not null
       and current_date - last_active_date in (3, 7)
       and (last_nudge_date is null or current_date - last_nudge_date >= 7)
     limit 500
  loop
    perform public.notify_user(
      r.user_id, 'nudge',
      case when r.gap = 3
        then 'Faz 3 dias que você não estuda — que tal 10 minutos hoje?'
        else 'Sua sequência está esperando. Volte e recupere o ritmo!' end,
      '/dashboard'
    );
    update public.user_gamification set last_nudge_date = current_date where user_id = r.user_id;
    v_nudges := v_nudges + 1;
  end loop;

  -- 2) Recap semanal (segunda-feira, uma vez)
  select value into v_state from public.site_config where key = 'growth_state';
  v_last_recap := nullif(v_state->>'weekly_recap_on', '')::date;

  if extract(isodow from current_date) = 1
     and (v_last_recap is null or v_last_recap < current_date) then
    for r in
      select g.user_id,
             coalesce(sum(x.amount) filter (where x.created_at >= current_date - 7), 0) as xp7,
             coalesce((select sum(minutes) from public.study_daily d
                        where d.user_id = g.user_id and d.day >= current_date - 7), 0) as min7,
             g.current_streak
        from public.user_gamification g
        left join public.xp_events x on x.user_id = g.user_id
       where g.last_active_date >= current_date - 14
       group by g.user_id, g.current_streak
       limit 2000
    loop
      perform public.notify_user(
        r.user_id, 'recap',
        'Sua semana: ' || r.min7 || ' min de estudo, ' || r.xp7 ||
          ' XP e sequência de ' || r.current_streak || ' dia(s).',
        '/dashboard'
      );
      v_recaps := v_recaps + 1;
    end loop;

    insert into public.site_config (key, value)
    values ('growth_state', jsonb_build_object('weekly_recap_on', current_date::text))
    on conflict (key) do update set value =
      coalesce(public.site_config.value, '{}'::jsonb) ||
      jsonb_build_object('weekly_recap_on', current_date::text),
      updated_at = now();
  end if;

  return jsonb_build_object('nudges', v_nudges, 'recaps', v_recaps);
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.user_gamification  enable row level security;
alter table public.xp_events          enable row level security;
alter table public.user_achievements  enable row level security;
alter table public.referral_codes     enable row level security;
alter table public.referrals          enable row level security;

drop policy if exists user_gamification_read on public.user_gamification;
create policy user_gamification_read on public.user_gamification
  for select to authenticated using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists xp_events_read on public.xp_events;
create policy xp_events_read on public.xp_events
  for select to authenticated using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists user_achievements_read on public.user_achievements;
create policy user_achievements_read on public.user_achievements
  for select to authenticated using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists user_achievements_update on public.user_achievements;
create policy user_achievements_update on public.user_achievements
  for update to authenticated using (user_id = auth.uid());

drop policy if exists referral_codes_read on public.referral_codes;
create policy referral_codes_read on public.referral_codes
  for select to authenticated using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists referrals_read on public.referrals;
create policy referrals_read on public.referrals
  for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_app_admin());
