-- ============================================================================
-- COGNI IA — Fase 6: Sistema de Redação ENEM & Vestibulares
-- Módulo independente. NÃO altera as fases anteriores.
-- A tabela `essays` da Fase 2 permanece intacta; a Fase 6 usa
-- `essay_submissions` + `essay_rubrics` + `essay_error_bank`.
--
-- Rodar no SQL Editor DEPOIS de 0001–0004.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'essay_status') then
    create type public.essay_status as enum (
      'rascunho', 'aguardando_transcricao', 'transcricao_confirmada',
      'corrigindo', 'corrigida', 'erro'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'essay_source') then
    create type public.essay_source as enum ('texto', 'imagem', 'pdf');
  end if;
  if not exists (select 1 from pg_type where typname = 'correction_type') then
    create type public.correction_type as enum ('simples', 'comentada');
  end if;
  if not exists (select 1 from pg_type where typname = 'detail_level') then
    create type public.detail_level as enum ('objetiva', 'equilibrada', 'detalhada');
  end if;
  if not exists (select 1 from pg_type where typname = 'correction_mode') then
    create type public.correction_mode as enum ('treino', 'simulacao');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RUBRICAS PERSONALIZADAS (spec §2.2)
-- ---------------------------------------------------------------------------
create table if not exists public.essay_rubrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  name        text not null,
  source      text,                          -- 'texto' | 'pdf' | 'word' | 'imagem'
  raw         text,
  parsed      jsonb,                         -- { criteria:[{name,weight,max,description}], scaleMax, notes, ambiguities:[] }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists essay_rubrics_user_idx on public.essay_rubrics (user_id);

drop trigger if exists essay_rubrics_set_updated_at on public.essay_rubrics;
create trigger essay_rubrics_set_updated_at
  before update on public.essay_rubrics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- REDAÇÕES ENVIADAS
-- ---------------------------------------------------------------------------
create table if not exists public.essay_submissions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users (id) on delete cascade,
  title                    text not null default 'Redação sem título',
  source                   public.essay_source not null default 'texto',
  raw_text                 text,             -- texto final confirmado (vai para a correção)
  transcription            text,             -- texto extraído por OCR, antes da confirmação
  transcription_confirmed  boolean not null default false,
  banca                    text not null default 'enem',   -- id da banca ou 'custom'
  rubric_id                uuid references public.essay_rubrics (id) on delete set null,
  correction_type          public.correction_type not null default 'comentada',
  detail_level             public.detail_level not null default 'equilibrada',
  mode                     public.correction_mode not null default 'treino',
  status                   public.essay_status not null default 'rascunho',
  -- resultado da correção
  grade                    numeric,
  grade_max                numeric,
  competencies             jsonb,            -- [{id,name,score,max,weight,comment}]
  errors                   jsonb,            -- [{excerpt,explanation,rule,correction,rewrite,priority,signature,category}]
  improvements             jsonb,            -- [{area,priority,note}]  (feedback §12/§13)
  max_score_gap            jsonb,            -- {missing:[],limiting:[],toPerfect:[]}  (§8)
  summary                  text,
  model                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  corrected_at             timestamptz
);
create index if not exists essay_submissions_user_idx
  on public.essay_submissions (user_id, created_at desc);
create index if not exists essay_submissions_user_status_idx
  on public.essay_submissions (user_id, status);

drop trigger if exists essay_submissions_set_updated_at on public.essay_submissions;
create trigger essay_submissions_set_updated_at
  before update on public.essay_submissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- BANCO DE ERROS RECORRENTES (spec §11)
-- ---------------------------------------------------------------------------
create table if not exists public.essay_error_bank (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  signature    text not null,     -- chave normalizada (ex.: "crase-antes-de-verbo")
  label        text not null,
  category     text,
  occurrences  int not null default 1,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  unique (user_id, signature)
);
create index if not exists essay_error_bank_user_idx
  on public.essay_error_bank (user_id, occurrences desc);

-- Incrementa (ou cria) uma entrada do banco de erros.
create or replace function public.bump_error_bank(
  p_user uuid,
  p_signature text,
  p_label text,
  p_category text default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.essay_error_bank (user_id, signature, label, category)
  values (p_user, p_signature, p_label, p_category)
  on conflict (user_id, signature) do update
    set occurrences = public.essay_error_bank.occurrences + 1,
        last_seen = now(),
        label = excluded.label
  returning occurrences into v_count;
  return v_count;
end;
$$;

-- ============================================================================
-- RLS — tudo por usuário (spec §17: privacidade total das redações)
-- ============================================================================
alter table public.essay_rubrics       enable row level security;
alter table public.essay_submissions   enable row level security;
alter table public.essay_error_bank    enable row level security;

drop policy if exists essay_rubrics_all_own on public.essay_rubrics;
create policy essay_rubrics_all_own on public.essay_rubrics
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists essay_submissions_all_own on public.essay_submissions;
create policy essay_submissions_all_own on public.essay_submissions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists essay_error_bank_read_own on public.essay_error_bank;
create policy essay_error_bank_read_own on public.essay_error_bank
  for select to authenticated using (auth.uid() = user_id);
-- escrita no banco de erros só via bump_error_bank (security definer).
