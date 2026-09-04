-- ============================================================================
-- COGNI IA — Fase 8: Assinaturas, Monetização e Controle de Acesso
-- Módulo independente. Mantém `public.users.plan` como CACHE do direito de
-- acesso, sincronizado a partir de `subscriptions` — assim todos os gates das
-- fases anteriores (que leem `profile.plan`) continuam válidos.
--
-- Rodar no SQL Editor DEPOIS de 0001–0006.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum
      ('active', 'cancelled', 'expired', 'paused', 'pending');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum
      ('approved', 'rejected', 'pending', 'in_process', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'billing_cycle') then
    create type public.billing_cycle as enum ('mensal', 'anual');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ASSINATURAS  (spec §3, §4)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references public.users (id) on delete cascade,
  plan                 text not null default 'premium',
  status               public.subscription_status not null default 'pending',
  provider             text not null default 'simulado',   -- 'mercadopago' | 'simulado'
  provider_ref         text,
  cycle                public.billing_cycle not null default 'mensal',
  price                numeric not null default 0,
  coupon_code          text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  started_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PAGAMENTOS  (spec §11)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  amount         numeric not null default 0,
  currency       text not null default 'BRL',
  status         public.payment_status not null default 'pending',
  provider       text not null default 'simulado',
  provider_ref   text,
  method         text,
  created_at     timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

-- ---------------------------------------------------------------------------
-- CONFIGURAÇÃO (limites do plano + anúncios) — editável pelo admin (spec §5, §6, §11)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

insert into public.billing_config (key, value) values
  ('plan_limits', '{
     "free": {
       "resumo_semanal": 2,
       "chat_mensagem_dia": 20,
       "questao_dia": 3,
       "exportacao_dia": 5,
       "simulado_dia": 1,
       "favoritos_max": 20,
       "historico_dias": 14,
       "grupos_post_dia": 8
     }
   }'::jsonb),
  ('ads', '{
     "enabled": true,
     "placements": {
       "biblioteca_feed":   { "enabled": true,  "mode": "native" },
       "comunidade_feed":   { "enabled": true,  "mode": "native" },
       "busca_resultados":  { "enabled": true,  "mode": "native" },
       "simulado_fim":      { "enabled": true,  "mode": "native" },
       "blog_artigo":       { "enabled": true,  "mode": "native" },
       "conteudo_publico":  { "enabled": true,  "mode": "native" }
     }
   }'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- CUPONS  (spec §8.1)
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  description      text,
  discount_pct     int not null default 0,
  discount_fixed   numeric not null default 0,
  applies_to       text not null default 'ambos',   -- 'mensal' | 'anual' | 'ambos'
  max_redemptions  int,
  per_user_limit   int not null default 1,
  valid_from       timestamptz,
  valid_until      timestamptz,
  active           boolean not null default true,
  redemptions      int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create table if not exists public.coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references public.coupons (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists coupon_redemptions_idx
  on public.coupon_redemptions (coupon_id, user_id);

-- ---------------------------------------------------------------------------
-- LOG DE EVENTOS DE COBRANÇA  (spec §13)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete set null,
  type        text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists billing_events_idx
  on public.billing_events (created_at desc);

-- ---------------------------------------------------------------------------
-- USO POR FUNCIONALIDADE  (limites centralizados — spec §5)
-- ---------------------------------------------------------------------------
create table if not exists public.feature_usage (
  user_id   uuid not null references public.users (id) on delete cascade,
  feature   text not null,
  period    text not null,          -- 'YYYY-MM-DD' (diário) ou 'YYYY-Www' (semanal)
  count     int not null default 0,
  primary key (user_id, feature, period)
);

create or replace function public.bump_feature_usage(
  p_user uuid, p_feature text, p_period text, p_delta int default 1
)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v int;
begin
  insert into public.feature_usage (user_id, feature, period, count)
  values (p_user, p_feature, p_period, p_delta)
  on conflict (user_id, feature, period) do update
    set count = public.feature_usage.count + p_delta
  returning count into v;
  return v;
end;
$$;

-- ============================================================================
-- FUNÇÕES DE PLANO — proteção contra alteração manual (spec §13)
-- ============================================================================

-- Recalcula users.plan a partir das assinaturas. Fonte única da verdade.
create or replace function public.sync_user_plan(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.users u
     set plan = case
       when exists (
         select 1 from public.subscriptions s
         where s.user_id = p_user
           and s.status = 'active'
           and (s.current_period_end is null or s.current_period_end > now())
       ) then 'premium'::public.plan_tier
       else 'free'::public.plan_tier
     end,
     updated_at = now()
   where u.id = p_user;
end;
$$;

-- Ativa/renova a assinatura do usuário logado (pagamento aprovado — real ou simulado).
-- Não recebe user_id: usa auth.uid() para impedir spoofing.
create or replace function public.activate_subscription(
  p_cycle text,
  p_provider text default 'simulado',
  p_provider_ref text default null,
  p_coupon text default null,
  p_amount numeric default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_price numeric;
  v_period timestamptz;
  v_sub uuid;
  v_coupon public.coupons;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  if p_cycle = 'anual' then
    v_price := 119.90; v_period := now() + interval '1 year';
  else
    p_cycle := 'mensal'; v_price := 14.90; v_period := now() + interval '1 month';
  end if;

  -- cupom (validação básica)
  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select * into v_coupon from public.coupons
     where upper(code) = upper(trim(p_coupon)) and active = true
       and (valid_from is null or valid_from <= now())
       and (valid_until is null or valid_until >= now())
       and (max_redemptions is null or redemptions < max_redemptions)
       and (applies_to = 'ambos' or applies_to = p_cycle);
    if found then
      if (select count(*) from public.coupon_redemptions
          where coupon_id = v_coupon.id and user_id = v_user) < v_coupon.per_user_limit then
        v_price := greatest(0, v_price - v_coupon.discount_fixed);
        v_price := round(v_price * (1 - v_coupon.discount_pct / 100.0), 2);
      else
        v_coupon := null;
      end if;
    else
      v_coupon := null;
    end if;
  end if;

  insert into public.subscriptions
    (user_id, plan, status, provider, provider_ref, cycle, price, coupon_code, current_period_end, cancel_at_period_end)
  values
    (v_user, 'premium', 'active', p_provider, p_provider_ref, p_cycle::public.billing_cycle, v_price,
     case when v_coupon.id is not null then v_coupon.code else null end, v_period, false)
  on conflict (user_id) do update set
    status = 'active', provider = excluded.provider, provider_ref = excluded.provider_ref,
    cycle = excluded.cycle, price = excluded.price, coupon_code = excluded.coupon_code,
    current_period_end = excluded.current_period_end, cancel_at_period_end = false,
    updated_at = now()
  returning id into v_sub;

  insert into public.payments (user_id, subscription_id, amount, status, provider, provider_ref, method)
  values (v_user, v_sub, coalesce(p_amount, v_price), 'approved', p_provider, p_provider_ref,
          case when p_provider = 'simulado' then 'simulado' else null end);

  if v_coupon.id is not null then
    update public.coupons set redemptions = redemptions + 1 where id = v_coupon.id;
    insert into public.coupon_redemptions (coupon_id, user_id, subscription_id)
    values (v_coupon.id, v_user, v_sub);
  end if;

  perform public.sync_user_plan(v_user);

  insert into public.billing_events (user_id, type, detail)
  values (v_user, 'subscription_activated',
          jsonb_build_object('cycle', p_cycle, 'price', v_price, 'provider', p_provider));

  return v_sub;
end;
$$;

-- Cancela a assinatura do usuário logado (mantém o acesso até o fim do período).
create or replace function public.cancel_subscription()
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  update public.subscriptions
     set cancel_at_period_end = true,
         status = case when current_period_end > now() then 'active' else 'cancelled' end,
         updated_at = now()
   where user_id = v_user;
  insert into public.billing_events (user_id, type) values (v_user, 'subscription_cancelled');
  perform public.sync_user_plan(v_user);
end;
$$;

-- Expira assinaturas vencidas (chamado por cron na Fase 10, ou manualmente).
create or replace function public.expire_due_subscriptions()
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_count int;
begin
  update public.subscriptions
     set status = 'expired', updated_at = now()
   where status in ('active', 'paused')
     and current_period_end is not null
     and current_period_end < now();
  get diagnostics v_count = row_count;

  update public.users u set plan = 'free', updated_at = now()
   where u.plan = 'premium'
     and not exists (
       select 1 from public.subscriptions s
       where s.user_id = u.id and s.status = 'active'
         and (s.current_period_end is null or s.current_period_end > now())
     );
  return v_count;
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;
alter table public.billing_config       enable row level security;
alter table public.coupons              enable row level security;
alter table public.coupon_redemptions   enable row level security;
alter table public.billing_events       enable row level security;
alter table public.feature_usage        enable row level security;

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
-- escrita só via funções security definer / service_role

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists billing_config_read on public.billing_config;
create policy billing_config_read on public.billing_config
  for select to authenticated using (true);
drop policy if exists billing_config_write on public.billing_config;
create policy billing_config_write on public.billing_config
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select to authenticated
  using (active = true or public.is_app_admin());
drop policy if exists coupons_write on public.coupons;
create policy coupons_write on public.coupons
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists coupon_redemptions_read on public.coupon_redemptions;
create policy coupon_redemptions_read on public.coupon_redemptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists billing_events_read on public.billing_events;
create policy billing_events_read on public.billing_events
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists feature_usage_read on public.feature_usage;
create policy feature_usage_read on public.feature_usage
  for select to authenticated using (user_id = auth.uid());
