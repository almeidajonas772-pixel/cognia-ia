-- ============================================================================
-- COGNI IA — Fase 9: Painel Administrativo, SEO, Blog e Analytics
-- Módulo independente. Reaproveita `app_admins` / `is_app_admin()` (Fase 7).
-- Rodar no SQL Editor DEPOIS de 0001–0007.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'blog_status') then
    create type public.blog_status as enum ('rascunho', 'agendado', 'publicado');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('ativo', 'suspenso', 'banido');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- BLOG (spec §8, §9, §11)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  subtitle         text,
  excerpt          text,
  content          text not null default '',
  cover_image_url  text,
  category         text not null default 'Estudos',
  tags             text[] not null default '{}',
  author_name      text not null default 'Equipe COGNI IA',
  status           public.blog_status not null default 'rascunho',
  seo_title        text,
  seo_description  text,
  keywords         text[] not null default '{}',
  reading_minutes  int not null default 4,
  published_at     timestamptz,
  scheduled_for    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists blog_posts_pub_idx
  on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_search_idx
  on public.blog_posts using gin
  (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- LOGS ADMINISTRATIVOS (spec §14)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references public.users (id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    text,
  detail       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists admin_logs_idx on public.admin_logs (created_at desc);

create or replace function public.log_admin_action(
  p_action text, p_target_type text default null,
  p_target_id text default null, p_detail jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_app_admin() then return; end if;
  insert into public.admin_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_detail,'{}'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------------
-- CONFIGURAÇÕES GERAIS (spec §15)
-- ---------------------------------------------------------------------------
create table if not exists public.site_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into public.site_config (key, value) values
  ('general', '{
    "name": "COGNI IA",
    "description": "Plataforma de estudos com IA para ENEM e vestibulares.",
    "contact_email": "contato@cogniai.com.br",
    "social": { "instagram": "", "youtube": "", "tiktok": "" },
    "terms_url": "/termos", "privacy_url": "/privacidade",
    "ga_id": ""
  }'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- MODERAÇÃO DE USUÁRIOS (spec §3, §6) — sem tocar em public.users
-- ---------------------------------------------------------------------------
create table if not exists public.user_moderation (
  user_id     uuid primary key references public.users (id) on delete cascade,
  status      public.user_status not null default 'ativo',
  reason      text,
  until       timestamptz,
  updated_at  timestamptz not null default now()
);
alter table public.user_moderation enable row level security;
drop policy if exists user_moderation_read on public.user_moderation;
create policy user_moderation_read on public.user_moderation
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists user_moderation_admin on public.user_moderation;
create policy user_moderation_admin on public.user_moderation
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

create or replace function public.user_is_blocked(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_moderation
    where user_id = p_user and status in ('suspenso', 'banido')
      and (until is null or until > now())
  );
$$;

-- Admin altera o plano manualmente (spec §3).
create or replace function public.admin_set_plan(p_user uuid, p_plan text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_app_admin() then raise exception 'forbidden'; end if;
  update public.users set plan = p_plan::public.plan_tier, updated_at = now()
   where id = p_user;
  insert into public.admin_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'set_plan', 'user', p_user::text, jsonb_build_object('plan', p_plan));
end;
$$;

-- ---------------------------------------------------------------------------
-- ANALYTICS — visitas de página (spec §13)
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id           bigint generated always as identity primary key,
  path         text not null,
  user_id      uuid references public.users (id) on delete set null,
  referrer     text,
  device       text,
  duration_ms  int,
  created_at   timestamptz not null default now()
);
create index if not exists page_views_path_idx on public.page_views (path, created_at desc);
create index if not exists page_views_time_idx on public.page_views (created_at desc);

create or replace function public.track_page_view(
  p_path text, p_referrer text default null, p_device text default null,
  p_duration_ms int default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.page_views (path, user_id, referrer, device, duration_ms)
  values (left(p_path, 300), auth.uid(), left(p_referrer, 300), p_device, p_duration_ms);
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.blog_posts   enable row level security;
alter table public.admin_logs   enable row level security;
alter table public.site_config  enable row level security;
alter table public.page_views   enable row level security;

drop policy if exists blog_public_read on public.blog_posts;
create policy blog_public_read on public.blog_posts
  for select using (status = 'publicado' or public.is_app_admin());
drop policy if exists blog_admin_write on public.blog_posts;
create policy blog_admin_write on public.blog_posts
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_logs_read on public.admin_logs;
create policy admin_logs_read on public.admin_logs
  for select to authenticated using (public.is_app_admin());

drop policy if exists site_config_read on public.site_config;
create policy site_config_read on public.site_config
  for select using (true);
drop policy if exists site_config_write on public.site_config;
create policy site_config_write on public.site_config
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists page_views_admin_read on public.page_views;
create policy page_views_admin_read on public.page_views
  for select to authenticated using (public.is_app_admin());
-- escrita só via track_page_view()

-- ============================================================================
-- LEITURA DO ADMIN sobre tabelas de fases anteriores (aditivo — só concede)
-- ============================================================================
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users
  for select to authenticated using (public.is_app_admin());

drop policy if exists essays_admin_read on public.essay_submissions;
create policy essays_admin_read on public.essay_submissions
  for select to authenticated using (public.is_app_admin());

drop policy if exists library_contents_admin_all on public.library_contents;
create policy library_contents_admin_all on public.library_contents
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists library_premium_admin_all on public.library_content_premium;
create policy library_premium_admin_all on public.library_content_premium
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists library_topics_admin_all on public.library_topics;
create policy library_topics_admin_all on public.library_topics
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists library_subjects_admin_all on public.library_subjects;
create policy library_subjects_admin_all on public.library_subjects
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists chat_usage_admin_read on public.chat_usage;
create policy chat_usage_admin_read on public.chat_usage
  for select to authenticated using (public.is_app_admin());

drop policy if exists activity_log_admin_read on public.activity_log;
create policy activity_log_admin_read on public.activity_log
  for select to authenticated using (public.is_app_admin());

drop policy if exists study_daily_admin_read on public.study_daily;
create policy study_daily_admin_read on public.study_daily
  for select to authenticated using (public.is_app_admin());

drop policy if exists community_posts_admin_count on public.community_group_posts;
create policy community_posts_admin_count on public.community_group_posts
  for select to authenticated using (public.is_app_admin());

-- ============================================================================
-- SEED — artigos de blog (SEO)
-- ============================================================================
insert into public.blog_posts
  (slug, title, subtitle, excerpt, content, category, tags, keywords, status, reading_minutes, published_at)
values
  ('como-estudar-para-o-enem-em-6-meses',
   'Como estudar para o ENEM em 6 meses',
   'Um plano realista, semana a semana',
   'Organize os 6 meses antes da prova com um cronograma que equilibra teoria, revisão e simulados.',
   E'## Comece pelo diagnóstico\n\nAntes de montar o cronograma, faça um simulado completo para saber onde você está. Isso define as prioridades.\n\n## Divida os 6 meses em três blocos\n\n- **Meses 1–2 — base:** cubra o conteúdo essencial de cada área, sem pressa.\n- **Meses 3–4 — profundidade:** foque nos temas de maior recorrência e comece a treinar redação toda semana.\n- **Meses 5–6 — revisão e simulados:** um simulado por semana, revisão ativa dos erros e ajuste fino.\n\n## Rotina semanal sugerida\n\n| Dia | Foco |\n| --- | --- |\n| Seg–Qua | Conteúdo novo (2 áreas por dia) |\n| Qui | Redação + correção |\n| Sex | Revisão dos erros da semana |\n| Sáb | Simulado ou bloco de questões |\n| Dom | Descanso / revisão leve |\n\n## O que mais importa\n\nConstância vale mais que maratona. Estudar 3 horas todo dia supera 12 horas só no fim de semana.',
   'ENEM', array['enem','cronograma','planejamento'],
   array['como estudar para o enem','cronograma enem','plano de estudos enem'],
   'publicado', 6, now() - interval '10 days'),
  ('tecnicas-de-redacao-nota-1000',
   'Técnicas de redação nota 1000 para o ENEM',
   'O que as redações de destaque têm em comum',
   'Da tese ao repertório e à proposta de intervenção: os pontos que separam uma boa redação de uma redação nota 1000.',
   E'## Tese clara desde a introdução\n\nA banca precisa saber sua posição já no primeiro parágrafo. Apresente o problema e o seu ponto de vista, mais os dois eixos que você vai desenvolver.\n\n## Repertório produtivo\n\nUm repertório bem explorado por parágrafo vale mais que vários soltos. Apresente, explique e **conecte** à tese.\n\n## Coesão entre parágrafos\n\nComece cada parágrafo com um conectivo que marque a relação com o anterior. Varie o vocabulário para não repetir a palavra-tema.\n\n## Proposta de intervenção completa\n\nAgente + ação + meio/modo + finalidade + detalhamento, sempre respeitando os direitos humanos.\n\n> Treine com correção toda semana — a evolução vem da repetição com feedback.',
   'Redação', array['redacao','enem','escrita'],
   array['redacao nota 1000','tecnicas de redacao enem','proposta de intervencao'],
   'publicado', 5, now() - interval '4 days'),
  ('resumo-de-fisica-para-o-enem',
   'Resumo de Física para o ENEM: o que mais cai',
   'Mecânica, energia, eletricidade e ondas',
   'Os tópicos de Física com maior recorrência no ENEM e como estudá-los de forma objetiva.',
   E'## Mecânica\n\nCinemática (MRU e MRUV), leis de Newton, trabalho e energia. Saber interpretar gráficos de posição e velocidade resolve muita questão.\n\n## Energia e potência\n\nConservação de energia, rendimento e consumo elétrico (kWh) aparecem em contexto de sustentabilidade.\n\n## Eletricidade\n\nCircuitos simples, potência dissipada, associação de resistores.\n\n## Ondas e óptica\n\nVelocidade, frequência e comprimento de onda; espectro eletromagnético; reflexão e refração.\n\nEstude sempre a partir de situações reais — é assim que o ENEM cobra.',
   'Física', array['fisica','enem','resumo'],
   array['resumo de fisica enem','fisica que mais cai no enem'],
   'publicado', 4, now() - interval '1 day')
on conflict (slug) do nothing;
