# Fase 2 — Configuração (Supabase)

Passo a passo para ligar autenticação + banco. ~15 minutos.

---

## 1. Criar o projeto Supabase

1. Acesse <https://supabase.com> → **New project**.
2. Escolha nome, senha do banco e região **South America (São Paulo)**.
3. Aguarde o provisionamento (~2 min).

## 2. Pegar as chaves

Em **Project Settings → API**, copie:

| Campo                     | Vai para (`.env.local`)          |
| ------------------------- | -------------------------------- |
| Project URL               | `NEXT_PUBLIC_SUPABASE_URL`       |
| Project API keys → `anon` | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  |
| `service_role` (secret)   | `SUPABASE_SERVICE_ROLE_KEY`      |

Crie o arquivo `.env.local` na raiz do projeto (copie de `.env.example`) e cole os valores.

## 3. Criar as tabelas

No painel: **SQL Editor → New query**. Cole todo o conteúdo de
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) e
clique em **Run**.

Isso cria: `users`, `progress`, `favorites`, `chat_history`, `essays`,
`community_posts`, com RLS ligado e um gatilho que cria o perfil em
`public.users` a cada cadastro.

Confira em **Table Editor** que as 6 tabelas apareceram.

## 4. Configurar URLs de autenticação

Em **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** adicione `http://localhost:3000/**`
  (em produção, adicione também `https://cogniai.com.br/**`)

## 5. Provedor de e-mail/senha

Em **Authentication → Providers → Email**: já vem ligado.

- Para testar rápido sem caixa de entrada, desligue **Confirm email**
  temporariamente. Em produção, mantenha **ligado**.

## 6. Google OAuth (opcional agora)

1. <https://console.cloud.google.com> → APIs & Services → Credentials →
   **Create Credentials → OAuth client ID → Web application**.
2. Em **Authorized redirect URIs**, adicione:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
3. Copie **Client ID** e **Client secret**.
4. No Supabase: **Authentication → Providers → Google** → cole os dois → salve.

## 7. Apple OAuth (opcional, exige conta paga de desenvolvedor)

Requer Apple Developer Program. Em **Authentication → Providers → Apple**,
informe **Services ID**, **Team ID**, **Key ID** e a chave `.p8`.
Pode ficar para depois — o botão "Continuar com Apple" mostra um aviso
amigável enquanto não estiver configurado.

## 8. Rodar

```bash
npm install
npm run dev
```

- `http://localhost:3000/cadastro` → criar conta
- rotas do app (`/dashboard`, etc.) redirecionam para `/login` sem sessão
- após login, topbar mostra o menu da conta com **Sair**
- `/perfil` lê e grava dados reais em `public.users`

---

## Como a proteção funciona

- **`middleware.ts`** roda na borda, renova a sessão e redireciona rotas
  protegidas para `/login` (e usuário logado sai das telas de auth).
- **`app/(app)/layout.tsx`** revalida no servidor (defesa em profundidade).
- **RLS no Postgres** garante que, mesmo com a chave `anon`, cada usuário só
  lê/escreve as próprias linhas.
