-- ============================================================================
-- COGNI IA — Fase 4: Chat Inteligente Educacional
-- Módulo independente. NÃO altera as Fases 1, 2 e 3.
-- A tabela `chat_history` da Fase 2 permanece intacta; a partir daqui as
-- conversas vivem em `chat_conversations` + `chat_messages`.
--
-- Rodar no SQL Editor do Supabase DEPOIS dos migrations 0001 e 0002.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_role') then
    create type public.chat_role as enum ('user', 'assistant', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'chat_mode') then
    -- persona/estilo (spec §7 FORMATO)
    create type public.chat_mode as enum (
      'professor', 'simples', 'detalhado', 'resumo', 'prova'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'chat_depth') then
    create type public.chat_depth as enum (
      'basico', 'intermediario', 'avancado'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- CONVERSAS
-- ---------------------------------------------------------------------------
create table if not exists public.chat_conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  title            text not null default 'Nova conversa',
  mode             public.chat_mode not null default 'professor',
  depth            public.chat_depth not null default 'intermediario',
  pinned           boolean not null default false,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists chat_conversations_user_idx
  on public.chat_conversations (user_id, last_message_at desc);

drop trigger if exists chat_conversations_set_updated_at on public.chat_conversations;
create trigger chat_conversations_set_updated_at
  before update on public.chat_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- MENSAGENS
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.chat_conversations (id) on delete cascade,
  user_id          uuid not null references public.users (id) on delete cascade,
  role             public.chat_role not null,
  content          text not null,
  attachments      jsonb not null default '[]'::jsonb,  -- [{type,name,...}]
  model            text,
  favorited        boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists chat_messages_conversation_idx
  on public.chat_messages (conversation_id, created_at);
create index if not exists chat_messages_favorited_idx
  on public.chat_messages (user_id) where favorited;
create index if not exists chat_messages_search_idx
  on public.chat_messages using gin (to_tsvector('portuguese', content));

-- Ao inserir mensagem, "toca" a conversa (ordena a lista da sidebar).
create or replace function public.touch_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.chat_conversations
     set last_message_at = now(), updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_touch on public.chat_messages;
create trigger chat_messages_touch
  after insert on public.chat_messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- MEMÓRIA INTELIGENTE POR USUÁRIO
-- ---------------------------------------------------------------------------
create table if not exists public.chat_user_memory (
  user_id         uuid primary key references public.users (id) on delete cascade,
  level           public.chat_depth,
  learning_style  text,                              -- 'visual' | 'textual' | 'pratico'
  subjects        jsonb not null default '{}'::jsonb, -- { "<slug>": { "seen": int, "last_at": iso } }
  difficulties    jsonb not null default '[]'::jsonb, -- ["<tema/termo>", ...]
  notes           text,                              -- memória em texto que o modelo lê
  updated_at      timestamptz not null default now()
);

drop trigger if exists chat_user_memory_set_updated_at on public.chat_user_memory;
create trigger chat_user_memory_set_updated_at
  before update on public.chat_user_memory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- USO DIÁRIO (base para os limites do plano — Fase 8)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_usage (
  user_id     uuid not null references public.users (id) on delete cascade,
  day         date not null default current_date,
  messages    int not null default 0,
  images      int not null default 0,
  summaries   int not null default 0,
  questions   int not null default 0,
  primary key (user_id, day)
);

-- Incremento atômico do uso do dia.
create or replace function public.bump_chat_usage(
  p_user uuid,
  p_messages int default 0,
  p_images int default 0,
  p_summaries int default 0,
  p_questions int default 0
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.chat_usage (user_id, day, messages, images, summaries, questions)
  values (p_user, current_date, p_messages, p_images, p_summaries, p_questions)
  on conflict (user_id, day) do update
    set messages  = public.chat_usage.messages  + excluded.messages,
        images    = public.chat_usage.images    + excluded.images,
        summaries = public.chat_usage.summaries + excluded.summaries,
        questions = public.chat_usage.questions + excluded.questions;
$$;

-- ============================================================================
-- RLS — tudo por usuário
-- ============================================================================
alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;
alter table public.chat_user_memory   enable row level security;
alter table public.chat_usage         enable row level security;

drop policy if exists chat_conversations_all_own on public.chat_conversations;
create policy chat_conversations_all_own on public.chat_conversations
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists chat_messages_all_own on public.chat_messages;
create policy chat_messages_all_own on public.chat_messages
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists chat_user_memory_all_own on public.chat_user_memory;
create policy chat_user_memory_all_own on public.chat_user_memory
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists chat_usage_read_own on public.chat_usage;
create policy chat_usage_read_own on public.chat_usage
  for select to authenticated using (auth.uid() = user_id);
-- escrita no uso só via bump_chat_usage (security definer) ou service_role.
